import fsp from 'node:fs/promises';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Type as t } from '@sinclair/typebox';
import { formsService } from '$lib/server/services/forms.service';
import { requestHandler } from '$lib/server/handlers';
import { BadRequestError, ForbiddenError } from '$lib/server/errors';
import { normalizeFormId } from '$lib/helpers';
import { createHmacKey, protectedEndpoint } from '$lib/server/altcha';
import { filesService } from '$lib/server/services/files.service';
import { formatDate } from '$lib/format';
import type { RequestHandler } from './$types';
import type { IFormBlockPartial, IPdfInputElement, IPdfInputOptions } from '$lib/types';
import type { PDFFont, PDFImage } from 'pdf-lib';

const fonts: Record<string, Buffer | null> = {
	serif: await fsp.readFile('./static/vendor/fonts/LibreBaskerville-Regular.ttf'),
	'sans-serif': await fsp.readFile('./static/vendor/fonts/Roboto-Regular.ttf')
};

export const POST = requestHandler(
	async (event, data) => {
		const formId = normalizeFormId(event.params.formId);
		await protectedEndpoint(event, createHmacKey(formId));
		const form = await formsService.findForm(formId);
		if (!form) {
			throw new ForbiddenError();
		}
		const blocks = form.steps.reduce((acc, step) => {
			acc.push(...step.blocks);
			return acc;
		}, [] as IFormBlockPartial[]);
		const pdfBlocks = blocks.filter(({ type }) => type === 'PdfInput');
		const block = pdfBlocks[data.index];
		if (!block || !block.options?.pdf) {
			throw new BadRequestError();
		}
    const pdfOptions = block.options.pdf as IPdfInputOptions;
		const fileId = pdfOptions.fileId;
		if (!fileId) {
			throw new BadRequestError();
		}
		const file = await filesService.findFile(fileId);
		if (!file) {
			throw new ForbiddenError();
		}
		if (!fonts[pdfOptions.fontFamily]) {
			throw new Error('Unknown font family.');
		}
		const stream = await filesService.storage.get(filesService.storage.getFilePath(file));
		const resp = new Response(stream);
		const pdf = await PDFDocument.load(await resp.arrayBuffer());
		pdf.registerFontkit(fontkit);
		const font = await pdf.embedFont(fonts[pdfOptions.fontFamily]!, { subset: true });
		for (const element of pdfOptions.elements as IPdfInputElement[]) {
			await renderElement({
				pdf,
				element,
				font,
				fontColor: pdfOptions.fontColor,
				fontSize: +pdfOptions.fontSize,
				block: blocks.find(({ name }) => name === element.name),
        locale: data.locale,
        tz: data.tz,
				value: element.name ? data.data[element.name] : void 0
			});
		}
		return new Response(await pdf.save(), {
			headers: {
				'content-type': 'application/pdf'
			}
		});
	},
	{
		authorization: false,
		body: t.Object({
			data: t.Record(t.String(), t.String()),
			index: t.Number({
				minimum: 0,
				maximum: 100
			}),
      locale: t.Optional(t.String()),
      tz: t.Optional(t.String()),
		}),
		rateLimit: 'L3'
	}
) satisfies RequestHandler;

async function renderElement(options: {
	block?: IFormBlockPartial;
	element: IPdfInputElement;
	font: PDFFont;
	fontColor: string;
	fontSize: number;
  locale?: string;
	pdf: PDFDocument;
  tz?: string;
	value?: string;
}) {
	const { block, element, font, fontColor, fontSize, locale, pdf, tz, value } = options;
	const page = pdf.getPage(element.page - 1);
	const { height, width } = page.getSize();
	const heightScale = height / element.pageHeight;
	const widthScale = width / element.pageWidth;
	const elHeight = element.height * heightScale;
	const elWidth = element.width * widthScale;
	const lineHeight = fontSize * 1.3;
	let image: PDFImage | null = null;
	switch (block?.type) {
		case 'SignatureInput':
			if (value) {
				image = await pdf.embedJpg(value);
				page.drawImage(image, {
					x: element.x * heightScale,
					y: height - element.y * heightScale - elHeight,
					height: image.scale(
						Math.min(1, elHeight / image.size().height, elWidth / image.size().width)
					).height,
					width: image.scale(
						Math.min(1, elHeight / image.size().height, elWidth / image.size().width)
					).width
				});
			}
			break;
		default:
			if (value || element.computed) {
				page.drawText(element.computed ? getComputedValue(element.computed, locale, tz) : value!, {
					color: parseColor(fontColor),
					font,
					lineHeight,
					x: element.x * widthScale,
					y: (height - element.y * heightScale) - (elHeight / 2) - (fontSize / 2.5),
					size: fontSize
				});
			}
	}
}

function parseColor(color: string) {
	const match = color.match(/^#(\w{2})(\w{2})(\w{2})$/);
	return match
		? rgb(parseInt(match[1], 16) / 255, parseInt(match[2], 16) / 255, parseInt(match[3], 16) / 255)
		: rgb(0, 0, 0);
}

function getComputedValue(computed: string, locale?: string, tz?: string) {
	switch (computed) {
		case 'date':
			return formatDate(new Date(), tz, locale);
	}
	return '';
}
