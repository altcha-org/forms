import { marked, type RendererObject } from 'marked';
import fm from 'front-matter';
import DOMPurify from 'isomorphic-dompurify';
import { replaceVariables } from './helpers';

export type TemplateChunk = ((vars: Record<string, unknown>) => string) | string;

export type Template = {
	attributes: Record<string, TemplateChunk[]>;
	body: TemplateChunk[];
};

function postprocess(html: string) {
	return DOMPurify.sanitize(html);
}

const renderer: RendererObject = {
	link(href, title, text) {
		let style = '';
		if (text.startsWith('[') && text.endsWith(']')) {
			style =
				'padding:10px;border-radius:5px;background:blue;color:white;font-weight:bold;text-decoration:none;line-height:2rem';
			text = text.slice(1, -1);
		}
		return `<a href="${href || ''}" title="${title || ''}" style="${style}">${text}</a>`;
	}
};

marked.use({ renderer, hooks: { postprocess } });

export function renderMarkdown(md: string) {
	return marked.parse(md, {
		breaks: true,
		gfm: true
	}) as string;
}

export function compileTemplate(md: string) {
	const fmResult = fm<Record<string, string>>(md.trim());
	const html = renderMarkdown(fmResult.body);
	const attributes: Record<string, TemplateChunk[]> = {};
	for (const name in fmResult.attributes) {
		attributes[name] = stringToTemplateChunks(fmResult.attributes[name]);
	}
	return {
		attributes,
		body: stringToTemplateChunks(html)
	};
}

export function renderTemplate(tpl: Template, vars: Record<string, unknown>) {
	const attributes: Record<string, string> = {};
	for (const name in tpl.attributes) {
		attributes[name] = renderTemplateChunks(tpl.attributes[name], vars);
	}
	return {
		attributes,
		html: renderTemplateChunks(tpl.body, vars)
	};
}

function renderTemplateChunks(chunks: TemplateChunk[], vars: Record<string, unknown>) {
	return chunks.map((chunk) => (typeof chunk === 'string' ? chunk : chunk(vars))).join('');
}

function stringToTemplateChunks(str: string) {
	const matches = str.matchAll(/\{[^}]+\}/g);
	const template: TemplateChunk[] = [];
	let pos = 0;
	for (const match of matches) {
		template.push(str.slice(pos, match.index));
		template.push(
			((prop: string, vars: Record<string, unknown>) => replaceVariables(prop, vars)).bind(
				void 0,
				match[0]
			)
		);
		if (match.index !== void 0) {
			pos = match.index + match[0].length;
		}
	}
	template.push(str.slice(pos));
	return template;
}
