import { randomBytes } from 'node:crypto';
import { createReadStream, createWriteStream, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import fsp from 'node:fs/promises';
import { BaseStorage } from '$lib/server/storage/base.storage';
import type { IFile } from '$lib/types';

export interface IFsStorageOptions {
	dir: string;
}

export class FsStorage extends BaseStorage {
	constructor(readonly options: IFsStorageOptions) {
		super();
		if (this.options.dir) {
			mkdirSync(this.options.dir, {
				recursive: true
			});
		}
	}

	async delete(path: string) {
		await fsp.unlink(this.getFullPath(path));
	}

	getFullPath(path: string) {
		if (!path.startsWith(this.options.dir)) {
			return join(this.options.dir, path);
		}
		return path;
	}

	getRandomPath() {
		return join(this.options.dir, randomBytes(12).toString('hex'));
	}

	async getUploadUrl(file: IFile): Promise<string> {
		return `/storage/${file.id}`;
	}

	async get(path: string): Promise<ReadableStream<Uint8Array>> {
		// @ts-expect-error node typings
		return Readable.toWeb(createReadStream(this.getFullPath(path)));
	}

	async getNodeStream(path: string) {
		return createReadStream(path);
	}

	async move(pathSource: string, pathTarget: string) {
		const destination = this.getFullPath(pathTarget);
		await fsp.mkdir(dirname(destination), {
			recursive: true
		});
		await fsp.rename(this.getFullPath(pathSource), destination);
	}

	async put(path: string, data: ReadableStream<Uint8Array>): Promise<void> {
		const fullPath = this.getFullPath(path);
		await fsp.mkdir(dirname(fullPath), {
			recursive: true
		});
		return new Promise((resolve, reject) => {
			const out = createWriteStream(fullPath);
			out.on('error', reject);
			out.on('finish', resolve);
			// @ts-expect-error node typings
			Readable.fromWeb(data).pipe(out);
		});
	}
}
