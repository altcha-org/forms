import { endOfDay, startOfDay } from 'date-fns';
import { redirect } from '@sveltejs/kit';
import { loadHandler } from '$lib/server/handlers';
import { formMiddleware } from '../shared';
import type { LayoutServerLoad } from './$types';

export const load = loadHandler(async (event) => {
	const end = event.url.searchParams.get('end');
	const start = event.url.searchParams.get('start');
	if (!end || !start) {
		redirect(307, generateUrlForLast30Days(event.params.formId!, event.url.origin));
	}
	const days = (new Date(end).getTime() - new Date(start).getTime()) / 86400000;
	if (days < 1 || days > 31) {
		redirect(307, generateUrlForLast30Days(event.params.formId!, event.url.origin));
	}
	const { account } = await formMiddleware(event);
	return {
		analyticsEnabled: account.plan?.featureAnalytics === true,
		end,
		start
	};
}) satisfies LayoutServerLoad;

function generateUrlForLast30Days(formId: string, origin: string) {
	const now = new Date();
	const url = new URL(`/app/forms/${formId}/analytics`, origin);
	url.searchParams.set('end', endOfDay(now).toISOString());
	url.searchParams.set(
		'start',
		startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)).toISOString()
	);
	return url;
}
