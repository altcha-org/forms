import { and, eq, gte, lt, lte, count, sql } from 'drizzle-orm';
import { endOfWeek, startOfWeek } from 'date-fns';
import { toZonedTime, format } from 'date-fns-tz';
import { getTimeZone } from '$lib/helpers';
import { db } from '$lib/server/db';
import { accounts, forms, sessions, sessionsCompacted } from '$lib/server/db/schema';
import { EIdPrefix, idgen } from '$lib/server/id';

export type ISession = NonNullable<Awaited<ReturnType<SessionsService['findSessionById']>>>;

export interface ISessionStatsOptions {
	dateEnd: Date;
	dateStart: Date;
	formId: string;
	includeCompacted?: boolean;
	maxDistinctValues?: number;
	timeZone?: string | null;
}

export interface ISessionCompactSessionsForFormOptions {
	dateEnd: Date;
	dateStart: Date;
	formId: string;
	timeZone?: string | null;
}

export interface ISessionStatsEntry {
	completionTime: number | null;
	correctionRate: number;
	countries: Record<string, number>;
	errored: number;
	fieldDropOff: Record<string, number>;
	mobile: number;
	submissions: number;
	views: number;
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
		> &
			Partial<Pick<ISession, 'id'>>
	) {
		const correction =
			!data.abondoned && data.fields?.length
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
				id: data.id || this.generateId(),
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
		const tz = options.timeZone || getTimeZone() || 'UTC';
		const results = await db
			.select({
				abondoned: sessions.abondoned,
				completionTime: sql`percentile_cont(0.99) within group (order by ${sessions.completionTime} asc)`,
				correctionRate: sql`avg(${sessions.correction})`,
				count: count(sessions.id),
				country: sessions.country,
				date: sql<string>`date_trunc('day', ${sessions.startAt} at time zone ${tz})`.as('date'),
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
		for (let i = 0; i < days; i++) {
			labels.push(
				format(new Date(new Date(options.dateStart).getTime() + 86400000 * i), 'yyyy-MM-dd', {
					timeZone: tz
				})
			);
		}
		const entries = labels
			.map((label) => {
				const values = results.reduce(
					(
						acc,
						{
							abondoned,
							completionTime,
							correctionRate,
							country,
							count,
							date,
							error,
							fieldDropOff,
							mobile
						}
					) => {
						const day = date.split(' ')[0];
						if (day.startsWith(label)) {
							if (!country) {
								country = 'unknown';
							}
							acc.countries[country] = (acc.countries[country] || 0) + count;
							acc.views += count;
							if (!abondoned) {
								acc.submissions += count;
							}
							if (Array.isArray(acc.correctionRate)) {
								acc.correctionRate.push(parseFloat(correctionRate as string));
							}
							if (completionTime && Array.isArray(acc.completionTime)) {
								acc.completionTime.push(parseFloat(completionTime as string));
							}
							if (error) {
								acc.errored += count;
							}
							if (fieldDropOff) {
								acc.fieldDropOff[fieldDropOff] = (acc.fieldDropOff[fieldDropOff] || 0) + count;
							}
							if (mobile) {
								acc.mobile += count;
							}
						}
						return acc;
					},
					{
						completionTime: [] as number[] | number | null,
						correctionRate: [] as number[] | number,
						countries: {} as Record<string, number>,
						errored: 0,
						fieldDropOff: {} as Record<string, number>,
						mobile: 0,
						submissions: 0,
						views: 0
					}
				);
				return {
					label,
					values
				};
			})
			.map((entry) => {
				if (Array.isArray(entry.values.completionTime)) {
					entry.values.completionTime = entry.values.completionTime.length
						? Math.floor(
								entry.values.completionTime.reduce((acc, t) => acc + t, 0) /
									entry.values.completionTime.length
							)
						: null;
				}
				if (Array.isArray(entry.values.correctionRate)) {
					entry.values.correctionRate = entry.values.correctionRate.length
						? Math.round(
								entry.values.correctionRate.reduce((acc, r) => acc + r, 0) /
									entry.values.correctionRate.length
							) / 100
						: 0;
				}
				entry.values.countries = this.sortAndSliceObject(
					entry.values.countries,
					options.maxDistinctValues
				);
				entry.values.fieldDropOff = this.sortAndSliceObject(
					entry.values.fieldDropOff,
					options.maxDistinctValues
				);
				return entry;
			}) as {
			label: string;
			values: ISessionStatsEntry;
		}[];
		if (options.includeCompacted) {
			const compacted = await this.statsCompacted(options);
			return [
				...compacted,
				...entries.filter(({ label }) => !compacted.find((c) => c.label === label))
			].sort((a, b) => a.label.localeCompare(b.label));
		}
		return entries;
	}

	async statsCompacted(options: ISessionStatsOptions) {
		const tz = options.timeZone || getTimeZone() || 'UTC';
		const results = await db
			.select({
				data: sessionsCompacted.data,
				date: sessionsCompacted.date
			})
			.from(sessionsCompacted)
			.where(
				and(
					eq(sessionsCompacted.formId, options.formId),
					lte(
						sessionsCompacted.date,
						startOfWeek(toZonedTime(options.dateEnd, tz), {
							weekStartsOn: 1
						})
					),
					gte(
						sessionsCompacted.date,
						startOfWeek(toZonedTime(options.dateStart, tz), {
							weekStartsOn: 1
						})
					)
				)
			);
		return results.reduce(
			(acc, { data, date }) => {
				data.forEach((entry, i) => {
					const d = new Date(date.getTime() + 86400000 * i);
					if (d <= options.dateEnd && d >= options.dateStart) {
						acc.push({
							label: format(d, 'yyyy-MM-dd', {
								timeZone: tz
							}),
							values: this.inflateStatsEntry(
								entry as ReturnType<SessionsService['deflateStatsEntry']>
							)
						});
					}
				});
				return acc;
			},
			[] as {
				label: string;
				values: ISessionStatsEntry;
			}[]
		);
	}

	async compactSessions(limit: number = 100) {
		// subtract one day to ensure end-of-day for the last timezone
		const maxDate = startOfWeek(new Date().getTime() - 86400000, {
			weekStartsOn: 1
		});
		const results = await db
			.select({
				date: sql<string>`date_trunc('week', ${sessions.startAt} at time zone ${accounts.timeZone})`.as(
					'date'
				),
				formId: sessions.formId,
				timeZone: accounts.timeZone
			})
			.from(sessions)
			.leftJoin(forms, eq(forms.id, sessions.formId))
			.leftJoin(accounts, eq(accounts.id, forms.accountId))
			.groupBy(sessions.formId, accounts.timeZone, sql`date`)
			.where(
				and(
					lt(
						sessions.id,
						idgen.prefixed(EIdPrefix.SESSION, idgen.boundary(maxDate.getTime(), true))
					)
				)
			)
			.limit(limit);
		for (const { date, formId, timeZone } of results) {
			const dateIso = date.split(' ')[0];
			// get dates for previous week
			const dateStart = startOfWeek(timeZone ? toZonedTime(dateIso, timeZone) : dateIso, {
				weekStartsOn: 1
			});
			const dateEnd = endOfWeek(dateStart, {
				weekStartsOn: 1
			});
			await this.compactSessionsForForm({
				dateEnd,
				dateStart,
				formId,
				timeZone
			});
		}
	}

	async compactSessionsForForm(options: ISessionCompactSessionsForFormOptions) {
		const tz = options.timeZone || getTimeZone() || 'UTC';
		const stats = await this.stats(options);
		const compacted = stats.reduce(
			(acc, entry) => {
				const week = format(
					startOfWeek(toZonedTime(entry.label, tz), {
						weekStartsOn: 1
					}),
					'yyyy-MM-dd',
					{
						timeZone: tz
					}
				);
				if (!acc[week]) {
					acc[week] = [];
				}
				acc[week].push(this.deflateStatsEntry(entry.values));
				return acc;
			},
			{} as Record<string, unknown[]>
		);
		const entries = Object.entries(compacted)
			.map(([date, data]) => {
				return {
					data,
					date: toZonedTime(date, tz),
					formId: options.formId
				};
			})
			.filter(({ data }) => !data.every((e) => e === 0));
		if (entries.length) {
			await db.insert(sessionsCompacted).values(entries).onConflictDoNothing();
		}
		await db
			.delete(sessions)
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
		return compacted;
	}

	private deflateStatsEntry(entry: ISessionStatsEntry) {
		if (entry.views === 0) {
			return 0;
		}
		return [
			entry.views,
			entry.submissions,
			entry.errored,
			entry.mobile,
			entry.completionTime,
			entry.correctionRate,
			entry.fieldDropOff,
			entry.countries
		] as const;
	}

	private inflateStatsEntry(
		entry: ReturnType<SessionsService['deflateStatsEntry']>
	): ISessionStatsEntry {
		if (entry === 0) {
			return {
				completionTime: null,
				correctionRate: 0,
				countries: {},
				errored: 0,
				fieldDropOff: {},
				mobile: 0,
				submissions: 0,
				views: 0
			};
		}
		return {
			completionTime: entry[4],
			correctionRate: entry[5],
			countries: entry[7],
			errored: entry[2],
			fieldDropOff: entry[6],
			mobile: entry[3],
			submissions: entry[1],
			views: entry[0]
		};
	}

	private sortAndSliceObject(obj: Record<string, number>, max: number = 20) {
		return Object.entries(obj)
			.sort((a, b) => (a[1] < b[1] ? 1 : -1))
			.slice(0, max)
			.reduce(
				(acc, [k, v]) => {
					acc[k] = v;
					return acc;
				},
				{} as Record<string, number>
			);
	}
}

export const sessionsService = new SessionsService();
