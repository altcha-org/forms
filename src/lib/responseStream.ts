import { get } from 'svelte/store';
import { encryptionKeys } from '$lib/stores';
import { decryptData, downloadFile } from '$lib/helpers';
import type { IFile, IResponse, TResponseData } from '$lib/types';

export interface IResponseStreamOptions {
	accountId: string;
	formId?: string;
	files?: boolean;
	responseIds?: string[];
	onAfterIndex?: (offset: number) => Promise<void> | void;
	onBeforeRequest?: (offset: number) => Promise<void> | void;
	onFile?: (response: IResponse, file: IFile, contents: ArrayBufferLike) => Promise<void> | void;
	onFileProgress?: (response: IResponse, file: IFile, bytesLoaded: number, bytesTotal: number) => Promise<void> | void;
	onRequest?: (offset: number, result: IResponseSearchResult) => Promise<void> | void;
	onResponse: (response: IResponse & { notes: number }, data: TResponseData | null, error?: string) => Promise<void> | void;
}

export interface IResponseSearchResult {
	offset: number;
	limit: number;
	total: number;
	responses: Array<IResponse & { notes: number }>;
}

export class ResponseStream {
	readonly controller = new AbortController();

	constructor(readonly options: IResponseStreamOptions) {
	}

  async stream() {
		let offset = 0;
		while (true) {
			if (this.controller.signal.aborted) {
				return null;
			}
			await this.options.onBeforeRequest?.(offset);
			const result = await this.fetchResponses(offset);
			for (const response of result.responses) {
				let data: TResponseData | null = null;
				if (this.controller.signal.aborted) {
					return null;
				}
				if (this.options.files && response.files) {
					const { files } = await this.fetchFiles(response.id);
					if (files.length) {
						for (const file of files) {
							const buf = await downloadFile(file, (bytesLoaded, bytesTotal) => {
								this.options.onFileProgress?.(response, file, bytesLoaded, bytesTotal);
							});
							await this.options.onFile?.(response, file, buf);
						}
					}
				}
				try {
					data = await this.decryptData(response);
				} catch (err: any) {
					await this.options.onResponse(response, data, err?.message); 
					continue;
				}
				await this.options.onResponse(response, data); 
			}
			await this.options.onAfterIndex?.(offset);
			const hasMore = result.total > (result.offset + result.responses.length) && result.responses.length === result.limit;
			if (!hasMore) {
				break;
			}
			offset += result.responses.length;
		}
		return offset;
  }

  async decryptData(response: IResponse) {
		if (response.encrypted && response.dataEncrypted && response.encryptionKeyHash) {
			const data = await decryptData(response.dataEncrypted, response.encryptionKeyHash, get(encryptionKeys));
      if (data === null) {
        throw new Error(`Unable to decrypt data (encryption key ${response.encryptionKeyHash}).`);
      }
      return data;
		}
    return response.data;
  }

	async fetchFiles(responseId: string) {
		const resp = await fetch(`/app/accounts/${this.options.accountId}/stream/responses/${responseId}/files`, {
			method: 'GET'
		});
    if (resp.status !== 200) {
      throw new Error(`Server responded with ${resp.status}`);
    }
		return resp.json();
	}

	async fetchResponses(
		offset: number = 0,
    limit: number = 100,
	): Promise<IResponseSearchResult> {
		const url = new URL(`/app/accounts/${this.options.accountId}/stream/responses`, location.origin);
		if (this.options.formId) {
			url.searchParams.set('formId', this.options.formId);
		}
		if (this.options.responseIds?.length) {
			url.searchParams.set('responseIds', this.options.responseIds.join(','));
		}
		url.searchParams.set('limit', String(limit));
		url.searchParams.set('offset', String(offset));
		const resp = await fetch(url, {
			method: 'GET'
		});
    if (resp.status !== 200) {
      throw new Error(`Server responded with ${resp.status}`);
    }
		const json = await resp.json();
		await this.options.onRequest?.(offset, json);
		return json;
	}
}
