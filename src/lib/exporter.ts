import { stringify as csv } from 'csv-stringify/browser/esm/sync';
import { Pdf } from '$lib/pdf';
import { formatDateTime } from '$lib/format';
import type { IFile, IForm, IResponse, TResponseData } from '$lib/types';

export function exportReponse(
	form: IForm,
	response: IResponse,
	data: TResponseData,
	files: Pick<IFile, 'id' | 'encrypted' | 'encryptionKeyHash' | 'name' | 'size' | 'type'>[] = [],
	format: 'pdf' | 'csv' | 'json'
) {
	switch (format) {
		case 'csv':
			const head = Object.keys(data);
			const body = Object.values(data);
			return new TextEncoder().encode(csv([head, body])).buffer;
		case 'json':
			return exportReponseAsJSON(form, response, data, files);
		case 'pdf':
			return exportResponseAsPDF(form, response, data, files);
		default:
			throw new Error('Unsupported export format.');
	}
}

export function exportReponseAsJSON(
	form: IForm,
	response: IResponse,
	data: TResponseData,
	files: Pick<IFile, 'id' | 'encrypted' | 'encryptionKeyHash' | 'name' | 'size' | 'type'>[] = []
) {
	for (const step of form.steps) {
		for (const block of step.blocks) {
			const value = data[block.name];
			if (value && ['FileInput', 'SignatureInput'].includes(block.type)) {
				const fileIds = String(value || '').split(',');
				data[block.name] = fileIds
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
			}
		}
	}
	return new TextEncoder().encode(
		JSON.stringify({
			response: {
				context: response.context,
				id: response.id
			},
			data,
			form: {
				id: form.id,
				name: form.name
			}
		})
	).buffer;
}

export function exportResponseAsPDF(
	form: IForm,
	response: IResponse,
	data: TResponseData,
	files: Pick<IFile, 'id' | 'encrypted' | 'encryptionKeyHash' | 'name' | 'size' | 'type'>[] = []
) {
	const pdf = new Pdf({
		pageNumbers: true
	});
	pdf.form(form, data, {
		files,
		responseId: response.id
	});
	pdf.footer(
		`${formatDateTime(new Date(), void 0, void 0, {
			timeStyle: 'long'
		})}\n${response.id}`
	);
	return pdf.buffer();
}
