import type { IProcessor } from '$lib/types';

export default [
	{
		configSchema: [
			{
				default: '0',
				label: '$_processor.field.store_retention',
				help: '$_processor.help.store_retention',
				name: 'retention',
				options: {
					max: 3650,
					min: 0
				},
				required: false,
				type: 'NumberInput'
			}
		],
		type: 'store'
	},
	{
		configSchema: [
			{
				label: '$_processor.field.email_recipient',
				help: '$_processor.help.email_recipient',
				name: 'recipient',
				options: {},
				required: true,
				type: 'TextInput'
			},
			{
				label: '$_processor.field.email_subject',
				help: '$_processor.help.email_subject',
				options: {},
				required: true,
				name: 'subject',
				type: 'TextInput'
			},
			{
				label: '$_processor.field.email_body',
				help: '$_processor.help.email_body',
				options: {},
				required: true,
				name: 'body',
				type: 'MultiLineTextInput'
			},
			{
				label: '$_processor.field.email_attach_pdf',
				help: '$_processor.help.email_attach_pdf',
				options: {},
				required: false,
				name: 'attachPdf',
				type: 'ToggleInput'
			}
		],
		type: 'email'
	},
	{
		configSchema: [
			{
				label: '$_processor.field.http_url',
				help: '$_processor.help.http_url',
				placeholder: 'https://...',
				name: 'url',
				options: {},
				required: true,
				type: 'UrlInput'
			},
			{
				label: '$_processor.field.http_method',
				name: 'method',
				options: {
					options: ['POST', 'PUT']
				},
				required: true,
				type: 'SelectInput'
			},
			{
				label: '$_processor.field.http_content_type',
				name: 'contentType',
				options: {
					options: [
						{
							label: 'JSON',
							value: 'application/json'
						},
						{
							label: 'Multipart Form',
							value: 'multipart/form-data'
						},
						{
							label: 'URL-encoded Form',
							value: 'application/x-www-form-urlencoded'
						}
					]
				},
				required: true,
				type: 'SelectInput'
			},
			{
				label: '$_processor.field.http_headers',
				help: '$_processor.help.http_headers',
				name: 'headers',
				options: {},
				required: false,
				type: 'MultiLineTextInput'
			},
			{
				label: '$_processor.field.terminate_on_failure',
				help: '$_processor.help.terminate_on_failure',
				name: 'terminateOnFailure',
				default: 'false',
				options: {},
				required: false,
				type: 'ToggleInput'
			}
		],
		type: 'http'
	},
	{
		configSchema: [
			{
				label: '$_processor.field.reject_spam',
				help: '$_processor.help.reject_spam',
				name: 'rejectSpam',
				default: 'false',
				options: {},
				required: false,
				type: 'ToggleInput'
			},
			{
				label: '$_processor.field.terminate_on_failure',
				help: '$_processor.help.terminate_on_failure',
				name: 'terminateOnFailure',
				default: 'false',
				options: {},
				required: false,
				type: 'ToggleInput'
			}
		],
		type: 'spamfilter'
	}
] satisfies IProcessor[];
