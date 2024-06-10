import { redirect } from '@sveltejs/kit';

export function load({ params }) {
	redirect(307, `/app/responses/${params.responseId}/data`);
}
