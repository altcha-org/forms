import { AwsClient } from 'aws4fetch';
import { BaseStorage } from '$lib/server/storage/base.storage';
import type { IFile } from '$lib/types';

export interface IS3StorageOptions {
	accessKeyId: string;
	bucket: string;
	endpoint: string;
	secretAccessKey: string;
	region: string;
}

export class S3Storage extends BaseStorage {
	readonly client: AwsClient;

	constructor(readonly options: IS3StorageOptions) {
		super();
		this.client = new AwsClient({
			...this.options
		});
	}

	getKeyUri(key: string) {
		const url = new URL(this.options.endpoint);
		url.pathname = url.pathname.replace(/\/$/, '') + `/${key.replace(/^\//, '')}`;
		return url.toString();
	}

	validateResponse(resp: Response) {
		if (resp.status >= 400) {
			throw new Error(`S3 operation failed with status code ${resp.status}.`);
		}
	}

	async getUploadUrl(
		file: Pick<IFile, 'accountId' | 'id' | 'name' | 'persistent' | 'size' | 'type'>
	): Promise<string> {
		const url = new URL(this.options.endpoint);
		url.pathname = url.pathname.replace(/\/$/, '') + this.getFilePath(file);
		url.searchParams.set('x-amz-expires', '3600');
		url.searchParams.set('content-type', file.type);
		const signed = await this.client.sign(
			new Request(url, {
				method: 'PUT'
			}),
			{
				aws: {
					signQuery: true
				}
			}
		);
		return signed.url;
	}

	async delete(key: string): Promise<void> {
		const resp = await this.client.fetch(this.getKeyUri(key), {
			method: 'DELETE'
		});
		this.validateResponse(resp);
	}

	async get(key: string): Promise<ReadableStream<Uint8Array>> {
		const resp = await this.client.fetch(this.getKeyUri(key));
		this.validateResponse(resp);
		return resp.body!;
	}

	async move(keySource: string, keyTarget: string): Promise<void> {
		const source = '/' + this.options.bucket + '/' + keySource.replace(/^\//, '');
		const resp = await this.client.fetch(this.getKeyUri(keyTarget), {
			headers: {
				'x-amz-copy-source': source
			},
			method: 'PUT'
		});
		this.validateResponse(resp);
		await this.delete(keySource);
	}

	async put(
		key: string,
		data: ReadableStream<Uint8Array>,
		contentType?: string,
		contentLength?: number
	): Promise<void> {
		const headers: Record<string, string> = {};
		if (contentType) {
			headers['content-type'] = contentType;
		}
		if (contentLength) {
			headers['content-length'] = String(contentLength);
		}
		const resp = await this.client.fetch(this.getKeyUri(key), {
			body: data,
			headers
		});
		this.validateResponse(resp);
	}
}
