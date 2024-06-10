import { AcroFormTextField, jsPDF } from 'jspdf';
import '$lib/pdf-fonts/Roboto-Regular-normal';
import '$lib/pdf-fonts/Roboto-Bold-bold';
import type { IFile, IForm } from './types';
import { stringifyBlockValue } from './helpers';

export interface IPdfOptions {
	baseFontSize: number;
	font: string;
	lineHeight: number;
	padding: [number, number];
	pageNumbers: boolean;
}

export interface IPdfFontStyle {
	size?: number;
}

export interface IPdfFooterOptions {
	border?: boolean;
}

export interface IPdfTextOptions {
	align?: 'center' | 'right';
	autoBreak?: boolean | number;
	link?: string;
	size?: number;
}

export interface IPdfFormOptions {
	files?: Pick<IFile, 'id' | 'encrypted' | 'encryptionKeyHash' | 'name' | 'size' | 'type'>[];
	responseId?: string;
	signature?: boolean;
}

export class Pdf {
	static hasSignature(contents: string) {
		const types = ['adbe.pkcs7.detached', 'etsi.cades.detached'];
		const matches = contents.match(/\/SubFilter\s*\/([\w.]*)/);
		return !!matches?.[1] && types.includes(matches[1].trim().toLowerCase());
	}

	readonly doc = new jsPDF({
		format: 'a4',
		unit: 'mm'
	});

	readonly options: IPdfOptions;

	cursor: [number, number] = [0, 0];

	footerHeight: number = 0;

	footerRenderer?: () => void;

	constructor(options: Partial<IPdfOptions> = {}) {
		const {
			baseFontSize = 12,
			font = 'Roboto',
			lineHeight = 1.3,
			padding = [20, 20],
			pageNumbers = false
		} = options;
		this.options = {
			baseFontSize,
			font,
			lineHeight,
			padding,
			pageNumbers
		};
		this.doc.setLineHeightFactor(lineHeight);
		this.doc.setLineWidth(0.25);
		this.doc.setDocumentProperties({
			author: '',
			creator: 'Altcha'
		} as any);
	}

	get lineHeight() {
		return this.doc.getLineHeight() / 2;
	}

	get maxX() {
		return this.doc.internal.pageSize.width - this.paddingX * 2;
	}

	get maxY() {
		return this.maxYBoundary - this.footerHeight;
	}

	get maxYBoundary() {
		return this.doc.internal.pageSize.height - this.paddingY * 2;
	}

	get paddingX() {
		return this.options.padding[0];
	}

	get paddingY() {
		return this.options.padding[1];
	}

	get currentPageNumber() {
		return this.doc.getCurrentPageInfo().pageNumber;
	}

	get x() {
		return this.paddingX + this.cursor[0];
	}

	get y() {
		return this.paddingY + this.cursor[1];
	}

	addPage() {
		this.doc.addPage();
		this.setCursor(0, 0);
	}

	buffer(): ArrayBuffer {
		this.finalize();
		return this.doc.output('arraybuffer');
	}

	finalize() {
		try {
			for (let i = 0; i < this.doc.getNumberOfPages(); i++) {
				this.doc.setPage(i + 1);
				if (this.footerRenderer) {
					this.footerRenderer();
				}
				this.renderPageNumber();
			}
		} catch {
			// noop
		}
	}

	footer(text: string, options: IPdfFooterOptions = {}) {
		const border = options.border !== false;
		const { h } = this.getTextDimensions(text);
		this.footerHeight = h + (border ? this.lineHeight - 0.5 : 0);
		this.footerRenderer = () => {
			this.setCursor(0, this.maxY);
			if (border) {
				this.line();
			}
			this.setFontSize(10);
			this.text(text, {
				autoBreak: false
			});
			this.setFontSize();
		};
	}

	form(form: IForm, data: Record<string, any>, options: IPdfFormOptions = {}) {
		for (const step of form.steps) {
			if (step.title) {
				this.heading(step.title, 2);
				this.lineBreak();
			}
			for (const block of step.blocks) {
				if (block.name) {
					if (block.type.endsWith('Content')) {
						continue;
					}
					let value = data[block.name];
					if (value === null || value === void 0) {
						value = '';
					}
					this.heading(block.label || block.name, 4);
					if (block.type === 'SignatureInput' && options.signature) {
						if (block.options.kind === 'certificate') {
							this.signature();
						} else if (!['certificate', 'other'].includes(block.options.kind) && value?.image) {
							this.image(value.image, value.format, value.width, value.height);
						} else {
							this.lineBreak(25);
						}
					} else if (['FileInput', 'SignatureInput'].includes(block.type)) {
						const files = String(value || '')
							.split(',')
							.filter((f) => !!f);
						if (files.length) {
							for (const fileId of files) {
								const file = options.files?.find(({ id }) => id === fileId);
								if (file) {
									this.text(file?.name || fileId, {
										link: new URL(
											`/app/responses/${options.responseId}/data#${fileId}`,
											location.origin || 'http://localhost'
										).toString()
									});
								} else {
									this.text(fileId);
								}
							}
						} else {
							this.text('—');
						}
					} else {
						this.text(stringifyBlockValue(value));
					}
					this.lineBreak();
				}
			}
		}
	}

	getTextDimensions(str: string) {
		const lines = this.doc.splitTextToSize(str, this.maxX);
		return this.doc.getTextDimensions(lines);
	}

	heading(text: string, level: number = 1) {
		switch (level) {
			case 1:
				this.setFontSize(this.options.baseFontSize * 1.6);
				break;
			case 2:
				this.setFontSize(this.options.baseFontSize * 1.4);
				break;
			case 3:
				this.setFontSize(this.options.baseFontSize * 1.2);
				break;
			case 4:
				this.setFontSize();
				break;
			default:
		}
		this.setFontStyle('bold');
		this.text(text, {
			autoBreak: 10
		});
		this.moveCursorBy(0, 2);
		this.setFontStyle();
		this.setFontSize();
		return this;
	}

	image(img: string, format: string, width: number, height: number) {
		this.doc.addImage(img, format, this.x, this.y, width, height);
		this.moveCursorBy(0, height);
	}

	line() {
		this.doc.line(this.x, this.y, this.x + this.maxX, this.y);
		this.moveCursorBy(0, this.lineHeight);
	}

	list(data: [string, unknown][]) {
		for (const [label, value] of data) {
			this.heading(String(label), 4);
			this.text(value === null || value === void 0 || value === '' ? '—' : String(value));
			this.lineBreak();
		}
	}

	moveCursorBy(x: number, y: number) {
		this.cursor = [this.cursor[0] + x, this.cursor[1] + y];
	}

	lineBreak(lineHeight: number = this.lineHeight) {
		this.setCursor(0, this.cursor[1] + lineHeight);
	}

	renderPageNumber() {
		const text = `${this.currentPageNumber} / ${this.doc.getNumberOfPages()}`;
		const { h } = this.getTextDimensions(text);
		this.setCursor(0, this.maxYBoundary - h);
		this.setFontSize(10);
		this.text(text, {
			align: 'right',
			autoBreak: false
		});
		this.setFontSize();
	}

	text(str: string, options: IPdfTextOptions = {}) {
		const lines = this.doc.splitTextToSize(str, this.maxX);
		const { h, w } = this.getTextDimensions(lines);
		if (options.autoBreak !== false && this.y + h + +(options.autoBreak || 0) > this.maxY) {
			this.addPage();
		}
		let offset = 0;
		if (options.align === 'right') {
			offset = this.maxX - w;
		} else if (options.align === 'center') {
			offset = (this.maxX - w) / 2;
		}
		if (options.size) {
			this.setFontSize(options.size);
		}
		if (options?.link) {
			this.doc.textWithLink(lines.join(''), this.x + offset, this.y, {
				url: options.link
			});
			this.doc.line(this.x + offset, this.y + 1, this.x + offset + w, this.y + 1);
		} else {
			this.doc.text(lines, this.x + offset, this.y);
		}
		this.setFontSize();
		this.moveCursorBy(0, h);
		return this;
	}

	save(filename?: string) {
		this.finalize();
		return this.doc.save(filename);
	}

	setCursor(x: number, y: number) {
		this.cursor = [x, y];
	}

	setFontSize(size: number = 12) {
		this.doc.setFontSize(size);
		return this;
	}

	setFontStyle(weight: 'bold' | 'normal' = 'normal') {
		this.doc.setFont(this.options.font, weight);
		return this;
	}

	signature(text?: string, width: number = this.maxX / 2, height: number = 35) {
		const field = new AcroFormTextField();
		// @ts-ignore
		field.FT = '/Sig';
		// @ts-ignore
		field.Ff = 2;
		field.fieldName = 'signature';
		field.x = this.x;
		field.y = this.y;
		field.height = height;
		field.width = width;
		this.doc.rect(this.x, this.y, width, height, 'D');
		this.doc.addField(field);
		this.moveCursorBy(0, height + this.lineHeight);
		if (text) {
			this.moveCursorBy(0, -3);
			this.text(text, {
				size: 10
			});
		}
	}
}
