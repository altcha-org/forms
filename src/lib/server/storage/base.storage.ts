import { idgen } from '$lib/server/id';
import type { IFile } from '$lib/types';

export abstract class BaseStorage {
	abstract getUploadUrl(file: IFile): Promise<string>;
	abstract get(key: string): Promise<ReadableStream<Uint8Array>>;
	abstract delete(key: string): Promise<void>;
	abstract move(keySource: string, keyTarget: string): Promise<void>;
	abstract put(
		key: string,
		data: ReadableStream<Uint8Array>,
		contentType?: string,
		contentLength?: number
	): Promise<void>;

	getFilePath(file: Pick<IFile, 'accountId' | 'id' | 'persistent'>) {
		const { time } = idgen.decode(file.id);
		const date = new Date(time).toISOString().split('T')[0];
		const folder = file.persistent ? 'persistent' : 'tmp';
		return `/${folder}/${file.accountId}/${date}/${file.id}`;
	}
}
