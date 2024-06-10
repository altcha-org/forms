/**
 * Usage:
 *
 * - bun run scripts/translate.ts de
 */

import assert from 'node:assert';
import { readFile, writeFile } from 'node:fs/promises';
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

const start = performance.now();
const contents = JSON.parse(await readFile(sourceFile, 'utf8'));
const result = {};

for (const section in contents) {
	console.log(`Translating section ${section}...`);
	const sectionResult = await translate(
		JSON.stringify(contents[section], null, '  '),
		targetLangCode
	);
	if (!sectionResult) {
		throw new Error('Unexpected result');
	}
	result[section] = JSON.parse(sectionResult);
}

console.log('Done in', Math.round(performance.now() - start), 'ms');
if (result) {
	const targetFile = sourceFile.replace('en-GB', targetLangCode);
	await writeFile(targetFile, JSON.stringify(result, null, '  '));
}
