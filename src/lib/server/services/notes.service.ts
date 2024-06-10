import { asc, count, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { notes } from '$lib/server/db/schema';
import { EIdPrefix, idgen } from '$lib/server/id';

export type INote = NonNullable<Awaited<ReturnType<NotesService['findNote']>>>;

export type INoteSchema = typeof notes.$inferSelect;

export class NotesService {
	readonly columns = {
		accountId: true,
		createdAt: true,
		encrypted: true,
		encryptionKeyHash: true,
		id: true,
		read: true,
		responseId: true,
		sentToEmailAt: true,
		text: true,
		textEncrypted: true,
		updatedAt: true
	} as const satisfies Partial<Record<keyof INoteSchema, boolean>>;

	generateId() {
		return idgen.prefixed(EIdPrefix.NOTE);
	}

	async countNotesForResponse(responseId: string) {
		const [result] = await db
			.select({
				count: count(notes.id)
			})
			.from(notes)
			.where(eq(notes.responseId, responseId));
		return result.count;
	}

	async createNote(
		data: Pick<
			INoteSchema,
			| 'accountId'
			| 'encrypted'
			| 'encryptionKeyHash'
			| 'formId'
			| 'responseId'
			| 'sentToEmailAt'
			| 'text'
			| 'textEncrypted'
			| 'userId'
		>
	) {
		const [result] = await db
			.insert(notes)
			.values({
				accountId: data.accountId,
				encrypted: data.encrypted,
				encryptionKeyHash: data.encryptionKeyHash,
				formId: data.formId,
				id: this.generateId(),
				responseId: data.responseId,
				sentToEmailAt: data.sentToEmailAt,
				text: data.text,
				textEncrypted: data.textEncrypted,
				userId: data.userId
			})
			.returning();
		return result;
	}

	async deleteNote(noteId: string) {
		await db.delete(notes).where(eq(notes.id, noteId));
	}

	async findNote(noteId: string) {
		return db.query.notes.findFirst({
			columns: this.columns,
			where: eq(notes.id, noteId),
			with: {
				account: {
					columns: {
						encryptionEnabled: true,
						name: true
					}
				},
				user: {
					columns: {
						email: true,
						id: true,
						name: true
					}
				}
			}
		});
	}

	async listNotesForResponse(responseId: string) {
		return db.query.notes.findMany({
			columns: this.columns,
			orderBy: [asc(notes.createdAt)],
			where: eq(notes.responseId, responseId),
			with: {
				user: {
					columns: {
						id: true,
						name: true
					}
				}
			}
		});
	}

	async updateNote(
		noteId: string,
		data: Partial<Pick<INoteSchema, 'encrypted' | 'encryptionKeyHash' | 'text' | 'textEncrypted'>>
	) {
		await db
			.update(notes)
			.set({
				encrypted: data.encrypted,
				encryptionKeyHash: data.encryptionKeyHash,
				text: data.text,
				textEncrypted: data.textEncrypted,
				updatedAt: new Date()
			})
			.where(eq(notes.id, noteId));
	}
}

export const notesService = new NotesService();
