/**
 * Usage:
 *
 * - bun run scripts/translate.ts de
 */

import assert from 'node:assert';
import { readFile, writeFile, exists } from 'node:fs/promises';
import OpenAI from 'openai';

const sourceFile = 'src/lib/i18n/locales/en-GB.json';

const targetLangCode = process.argv[process.argv.length - 1];

assert(targetLangCode, 'Target language must provided as the last argument.');

const openai = new OpenAI({
	apiKey: process.env['OPENAI_API_KEY']
});

async function translate(text: string, lang: string) {
	const chat = await openai.chat.completions.create({
		messages: [
			{
				role: 'system',
				content: `You are a translation API translating to language ISO code: ${lang}. When provided with input encoded as JSON, translate the values and output a valid JSON result. Do NOT translate variables marked with curly brackets ({var_name}).`
			},
			{
				role: 'user',
				content: text
			}
		],
		model: 'gpt-3.5-turbo'
	});
	return chat.choices[0]?.message?.content;
}

const targetFile = sourceFile.replace('en-GB', targetLangCode);
const targetExists = await exists(targetFile);
const start = performance.now();
const sourceContents = JSON.parse(await readFile(sourceFile, 'utf8'));
const targetContents = targetExists ? JSON.parse(await readFile(targetFile, 'utf8')) : null;
const result = {};

for (const section in sourceContents) {
	console.log(`Translating section ${section}...`);
	if (targetContents) {
		const missing = getMissingKeys(sourceContents[section], targetContents[section]);
		if (Object.keys(missing).length) {
			const sectionResult = await translate(
				JSON.stringify(missing, null, '  '),
				targetLangCode
			);
			if (!sectionResult) {
				throw new Error('Unexpected result');
			}
			result[section] = {
				...targetContents[section],
				...JSON.parse(sectionResult),
			};
		} else {
			result[section] = targetContents[section];
		}
	} else {
		const sectionResult = await translate(
			JSON.stringify(sourceContents[section], null, '  '),
			targetLangCode
		);
		if (!sectionResult) {
			throw new Error('Unexpected result');
		}
		result[section] = JSON.parse(sectionResult);
	}
}

console.log('Done in', Math.round(performance.now() - start), 'ms');
if (result) {
	await writeFile(targetFile, JSON.stringify(result, null, '  '));
}

function getMissingKeys(source: Record<string, string>, target: Record<string, string>) {
	return Object.entries(source).reduce((acc, [ key, value ]) => {
		if (!target[key]) {
			acc[key] = value;
		}
		return acc;
	}, {});
}
