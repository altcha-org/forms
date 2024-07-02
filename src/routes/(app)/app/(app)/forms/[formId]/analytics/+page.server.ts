import { parseISO } from 'date-fns';
import { loadHandler } from '$lib/server/handlers.js';
import { sessionsService } from '$lib/server/services/sessions.service';
import { formMiddleware } from '../shared';
import type { PageServerLoad } from './$types';

export const load = loadHandler(
	async (event) => {
		const { end, start } = await event.parent();
		const { form } = await formMiddleware(event);
		const demo = event.url.searchParams.get('demo') === '1';
		if (demo) {
			return {
				stats: generateDemoData(),
			};
		}
		const dateEnd = parseISO(end);
		const dateStart = parseISO(start);
		const stats = await sessionsService.stats({
			dateEnd,
			dateStart,
			formId: form.id,
		});
		return {
			stats,
		};
	},
) satisfies PageServerLoad;

function generateDemoData() {
	const startDate = new Date(Date.now() - 86400000 * 30);
	const totalViews = Math.round(Math.random() * 1000) + 1000;
	const views = [...Array(30)].map((_, i) => {
		const value = Math.round(Math.random() * 1000);
		return {
			label: new Date(startDate.getTime() + 86400000 * i).toISOString().split('T')[0],
			value: [value, Math.round(value * 0.7)],
		};
	});
	return {
		countries: ['us', 'gb', 'de', 'es', 'it', 'nl', 'fr', 'se'].reduce((acc, code) => {
			acc[code] = Math.round(Math.random() * 1000);
			return acc;
		}, {} as Record<string, number>),
		fieldDropOff: ['Address', 'Phone', 'Message', 'Email', 'Name'].reduce((acc, name) => {
			acc[name] = Math.round(Math.random() * 200);
			return acc;
		}, {} as Record<string, number>),
		summary: {
			completionTime: 12560,
			correctionRate: 0.12,
			errored: 0,
			mobile: Math.floor(totalViews * 0.34),
			submissions: Math.floor(totalViews * 0.7),
			views: totalViews,
		},
		views,
	};
}
