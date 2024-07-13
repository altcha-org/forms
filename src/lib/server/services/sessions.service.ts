import { and, eq, gte, lte, count, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema';
import { EIdPrefix, idgen } from '$lib/server/id';

export type ISession = NonNullable<Awaited<ReturnType<SessionsService['findSessionById']>>>;

export interface ISessionStatsOptions {
	dateEnd: Date;
	dateStart: Date;
	formId: string;
}

export class SessionsService {
	readonly columns = {
		abondoned: true,
		completionTime: true,
		correction: true,
		country: true,
		error: true,
		fieldDropOff: true,
		fields: true,
		formId: true,
		id: true,
		mobile: true,
		responseId: true,
		startAt: true,
		submitAt: true
	} as const satisfies Partial<Record<keyof typeof sessions.$inferSelect, boolean>>;

	generateId() {
		return idgen.prefixed(EIdPrefix.SESSION);
	}

	async findSessionById(sessionId: string) {
		return db.query.sessions.findFirst({
			columns: this.columns,
			where: eq(sessions.id, sessionId)
		});
	}

	async createSession(
		data: Pick<
			ISession,
			| 'abondoned'
			| 'country'
			| 'error'
			| 'fieldDropOff'
			| 'fields'
			| 'formId'
			| 'mobile'
			| 'responseId'
			| 'startAt'
			| 'submitAt'
		>
	) {
		const correction =
			!data.abondoned && data.fields
				? Math.floor(
						(data.fields.reduce((acc, field) => {
							return acc + Math.max(0, field[3] - 1);
						}, 0) /
							data.fields.length) *
							100
					)
				: 0;
		await db
			.insert(sessions)
			.values({
				abondoned: data.abondoned,
				completionTime:
					!data.abondoned && data.submitAt && data.startAt
						? data.submitAt?.getTime() - data.startAt.getTime()
						: null,
				correction,
				country: data.country,
				error: data.error,
				fieldDropOff: data.fieldDropOff,
				fields: data.fields,
				formId: data.formId,
				id: this.generateId(),
				mobile: data.mobile,
				responseId: data.responseId,
				startAt: data.startAt,
				submitAt: data.submitAt
			})
			.returning({
				id: sessions.id
			});
	}

	async stats(options: ISessionStatsOptions) {
		const results = await db
			.select({
				abondoned: sessions.abondoned,
				completionTime: sql`percentile_cont(0.99) within group (order by ${sessions.completionTime} asc)`,
				correctionRate: sql`avg(${sessions.correction})`,
				count: count(sessions.id),
				country: sessions.country,
				date: sql`date_trunc('day', ${sessions.startAt})`.as('date'),
				error: sessions.error,
				fieldDropOff: sessions.fieldDropOff,
				mobile: sessions.mobile
			})
			.from(sessions)
			.groupBy(
				sessions.abondoned,
				sessions.fieldDropOff,
				sessions.error,
				sessions.country,
				sessions.mobile,
				sql`date`
			)
			.where(
				and(
					eq(sessions.formId, options.formId),
					gte(
						sessions.id,
						idgen.prefixed(EIdPrefix.SESSION, idgen.boundary(options.dateStart.getTime(), false))
					),
					lte(
						sessions.id,
						idgen.prefixed(EIdPrefix.SESSION, idgen.boundary(options.dateEnd.getTime(), true))
					)
				)
			);
		const days = Math.ceil(
			(new Date(options.dateEnd).getTime() - new Date(options.dateStart).getTime()) / 86400000
		);
		const labels: string[] = [];
		const correctionRate =
			Math.round(
				results.reduce((acc, { correctionRate }) => acc + (correctionRate as number), 0) /
					results.length
			) / 100;
		const errored = results.reduce((acc, { error, count }) => acc + (error ? count : 0), 0);
		const views = results.reduce((acc, { count }) => acc + count, 0);
		const mobile = results.reduce((acc, { count, mobile }) => acc + (mobile ? count : 0), 0);
		const submissions = results.reduce(
			(acc, { abondoned, count, error }) => acc + (abondoned || error ? 0 : count),
			0
		);
		const completionTime = results.reduce(
			(acc, { completionTime }) => (completionTime ? [...acc, completionTime as number] : acc),
			[] as number[]
		);
		for (let i = 0; i < days; i++) {
			labels.push(
				new Date(new Date(options.dateStart).getTime() + 86400000 * i).toISOString().split('T')[0]
			);
		}
		return {
			summary: {
				completionTime: completionTime.reduce((acc, t) => acc + t, 0) / completionTime.length,
				correctionRate,
				errored,
				mobile,
				submissions,
				views
			},
			countries: results.reduce(
				(acc, { country, count }) => {
					if (!country) {
						country = 'unknown';
					}
					acc[country] = (acc[country] || 0) + count;
					return acc;
				},
				{} as Record<string, number>
			),
			fieldDropOff: results.reduce(
				(acc, { fieldDropOff, count }) => {
					if (fieldDropOff) {
						acc[fieldDropOff] = (acc[fieldDropOff] || 0) + count;
					}
					return acc;
				},
				{} as Record<string, number>
			),
			views: labels.map((label) => {
				const views = results.reduce(
					(acc, { date, count }) => acc + (String(date).startsWith(label) ? count : 0),
					0
				);
				const submissions = results.reduce(
					(acc, { abondoned, date, count }) =>
						acc + (!abondoned && String(date).startsWith(label) ? count : 0),
					0
				);
				return {
					label,
					value: [views, submissions]
				};
			})
		};
	}
}

export const sessionsService = new SessionsService();
