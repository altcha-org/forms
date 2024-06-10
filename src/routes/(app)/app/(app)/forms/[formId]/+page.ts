import { redirect } from '@sveltejs/kit';

export function load({ params }) {
	redirect(307, `/app/forms/${params.formId}/inbox`);
}
