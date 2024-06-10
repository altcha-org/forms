/**
 * Usage:
 *
 * - bun run scripts/translate-templates.ts de
 */

import assert from 'node:assert';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { glob } from 'glob';
import OpenAI from 'openai';

const targetLangCode = process.argv[process.argv.length - 1];
const files = await globFiles();

assert(files.length, 'No files have been found matching the pattern.');
assert(targetLangCode, 'Target language must provided as the last argument.');

const openai = new OpenAI({
	apiKey: process.env['OPENAI_API_KEY']
});

async function globFiles(pattern: string = `templates/forms/en-GB/*.json`) {
	return [...(await glob(pattern))];
}

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

for (const file of files) {
	const start = performance.now();
	console.log('Translating', file);
	const contents = await readFile(file, 'utf8');
	const targetFile = file.replaceAll('en-GB', targetLangCode);
	const result = await translate(contents, targetLangCode);
	console.log('Done in', Math.round(performance.now() - start), 'ms');
	if (result) {
		await mkdir(dirname(targetFile), {
			recursive: true
		});
		await writeFile(targetFile, result);
	}
}
