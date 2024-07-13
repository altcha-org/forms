import { stringify as csv } from 'csv-stringify/browser/esm/sync';
import { Pdf } from '$lib/pdf';
import { formatDateTime } from '$lib/format';
import type { IFile, IForm, IResponse, TResponseData } from '$lib/types';

type TPartialFile = Pick<
	IFile,
	'id' | 'encrypted' | 'encryptionKeyHash' | 'name' | 'size' | 'type'
>;

type TFormats = 'pdf' | 'csv' | 'json';

type TExportResponsesResult = {
	contents: ArrayBufferLike;
	name: string;
	type: string;
}[];

interface IExportResponsesOptions {
	individual?: boolean;
}

export function exportResponses(
	form: IForm,
	responses: { response: IResponse; data: TResponseData; files?: TPartialFile[] }[],
	format: TFormats,
	options: IExportResponsesOptions = {}
): TExportResponsesResult {
	switch (format) {
		case 'csv':
			return exportResponsesAsCSV(form, responses, options);
		case 'json':
			return exportResponsesAsJSON(form, responses, options);
		case 'pdf':
			return exportResponsesAsPDF(form, responses);
		default:
			throw new Error('Unsupported export format.');
	}
}

export function exportResponsesAsCSV(
	form: IForm,
	responses: { response: IResponse; data: TResponseData; files?: TPartialFile[] }[],
	options: IExportResponsesOptions = {}
): TExportResponsesResult {
	const blocks = getFormBlocks(form);
	const head = ['id', 'created_at', ...blocks.map(({ name }) => name)];
	const body = responses.reduce((acc, { data, response }) => {
		const row: string[] = [response.id, new Date(response.createdAt).toISOString()];
		acc.push(row);
		for (const { name } of blocks) {
			row.push(data[name] === void 0 ? '' : String(data[name]));
		}
		return acc;
	}, [] as string[][]);
	if (options.individual) {
		return body.map((row) => {
			return {
				contents: new TextEncoder().encode(csv([head, row])).buffer,
				name: `${row[0]}.csv`,
				type: 'text/csv'
			};
		});
	}
	return [
		{
			contents: new TextEncoder().encode(csv([head, ...body])).buffer,
			name: `${form.id}.csv`,
			type: 'text/csv'
		}
	];
}

export function exportResponsesAsJSON(
	form: IForm,
	responses: { response: IResponse; data: TResponseData; files?: TPartialFile[] }[],
	options: IExportResponsesOptions = {}
) {
	const blocks = getFormBlocks(form);
	const entries: { response: Pick<IResponse, 'id' | 'createdAt'>; data: TResponseData }[] = [];
	for (const { data, files, response } of responses) {
		entries.push({
			response: {
				id: response.id,
				createdAt: response.createdAt
			},
			data: blocks.reduce(
				(acc, { name, type }) => {
					if (files && ['ImageInput', 'FileInput', 'SignatureInput'].includes(type)) {
						const fileIds = String(data[name] || '').split(',');
						acc[name] = fileIds
							.map((fileId) => files.find(({ id }) => id === fileId))
							.filter((file) => !!file)
							.map((file) => {
								return {
									encrypted: file?.encrypted,
									encryptionKeyHash: file?.encrypted ? file?.encryptionKeyHash : void 0,
									id: file?.id,
									name: file?.name,
									size: file?.size,
									type: file?.type
								};
							});
					} else {
						acc[name] = data[name] === void 0 ? '' : String(data[name]);
					}
					return acc;
				},
				{} as Record<string, unknown>
			)
		});
	}
	if (options.individual) {
		return entries.map((entry) => {
			return {
				contents: new TextEncoder().encode(JSON.stringify(entry)).buffer,
				name: `${entry.response.id}.json`,
				type: 'application/json'
			};
		});
	}
	return [
		{
			contents: new TextEncoder().encode(JSON.stringify(entries)).buffer,
			name: `${form.id}.json`,
			type: 'application/json'
		}
	];
}

export function exportResponsesAsPDF(
	form: IForm,
	responses: { response: IResponse; data: TResponseData; files?: TPartialFile[] }[]
) {
	return responses.map(({ data, response, files }) => {
		const pdf = new Pdf({
			pageNumbers: true
		});
		pdf.form(form, data, {
			files,
			responseId: response.id
		});
		pdf.footer(
			`${formatDateTime(response.createdAt, void 0, void 0, {
				timeStyle: 'long'
			})}\n${response.id}`
		);
		return {
			contents: pdf.buffer(),
			name: `${response.id}.pdf`,
			type: 'application/pdf'
		};
	});
}

function getFormBlocks(form: IForm) {
	return form.steps.reduce(
		(acc, step) => {
			for (const block of step.blocks) {
				if (block.name) {
					acc.push({
						name: block.name,
						type: block.type
					});
				}
			}
			return acc;
		},
		[] as { name: string; type: string }[]
	);
}
