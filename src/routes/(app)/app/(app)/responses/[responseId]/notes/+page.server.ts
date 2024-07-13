import { responseMiddleware } from '../shared.server';
import { Type as t } from '@sinclair/typebox';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { notesService } from '$lib/server/services/notes.service';
import { accountsService } from '$lib/server/services/accounts.service';
import { responsesService } from '$lib/server/services/responses.service';
import { ForbiddenError } from '$lib/server/errors';
import { emailService } from '$lib/server/services/email.service';
import { renderMarkdown } from '$lib/markdown';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(async ({ parent }) => {
	const { account, response } = await parent();
	if (!account.plan?.featureNotes) {
		throw new ForbiddenError();
	}
	return {
		form: response.form,
		notes: await notesService.listNotesForResponse(response.id)
	};
}) satisfies PageServerLoad;

export const actions = {
	addNote: actionHandler(
		async (event, data) => {
			const { response } = await responseMiddleware(event);
			if (!response.form.account.plan?.featureNotes) {
				throw new ForbiddenError();
			}
			const encrypted = response.form.account?.encryptionEnabled
				? await accountsService.encryptData(
						response.accountId,
						data.text,
						response.form.encryptionKeyHash
					)
				: null;
			if (data.sendToEmail) {
				await emailService.sendTemplate(
					emailService.getTemplate('response-note', event.locals.locale),
					{
						text: renderMarkdown(data.text),
						responseId: response.id
					},
					{
						accountId: response.accountId,
						responseId: response.id,
						to: data.sendToEmail
					}
				);
			}
			const note = await notesService.createNote({
				accountId: response.accountId,
				formId: response.formId,
				responseId: response.id,
				encrypted: !!encrypted,
				encryptionKeyHash: encrypted?.encryptionKeyHash || null,
				sentToEmailAt: data.sendToEmail ? new Date() : null,
				text: encrypted ? null : data.text,
				textEncrypted: encrypted?.dataEncrypted || null,
				userId: event.locals.user.id
			});
			await responsesService.updateResponse(response.id, {}, [
				{
					text: `User ${event.locals.user.name} added a note [${note.id}]`,
					time: Date.now()
				}
			]);
		},
		{
			body: t.Object({
				text: t.String(),
				sendToEmail: t.Optional(
					t.String({
						format: 'email'
					})
				)
			})
		}
	),

	deleteNote: actionHandler(
		async (event, data) => {
			const note = await notesService.findNote(data.noteId);
			if (note?.user && note.user.id === event.locals.user.id) {
				await notesService.deleteNote(data.noteId);
				await responsesService.updateResponse(note.responseId, {}, [
					{
						text: `User ${event.locals.user.name} deleted a note [${note.id}]`,
						time: Date.now()
					}
				]);
			}
		},
		{
			body: t.Object({
				noteId: t.String()
			})
		}
	),

	updateNote: actionHandler(
		async (event, data) => {
			const note = await notesService.findNote(data.noteId);
			if (note?.user && note.user.id === event.locals.user.id) {
				const encrypted = note.account?.encryptionEnabled
					? await accountsService.encryptData(note.accountId, data.text)
					: null;
				await notesService.updateNote(data.noteId, {
					encrypted: !!encrypted,
					encryptionKeyHash: encrypted?.encryptionKeyHash || null,
					text: encrypted ? null : data.text,
					textEncrypted: encrypted?.dataEncrypted || null
				});
			}
		},
		{
			body: t.Object({
				noteId: t.String(),
				text: t.String()
			})
		}
	)
} satisfies Actions;
