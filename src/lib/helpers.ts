import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';
import TIMEZONES from '$lib/timezones';
import InlineAltchaWorker from 'altcha-lib/worker?worker&inline';
import { cipher, rsa } from '@altcha/crypto';
import { solveChallengeWorkers } from 'altcha-lib';
import { encryptionKeys, uploadProgress } from '$lib/stores';
import { formatBytes, formatDate, formatDateTime, formatNumber, formatPrice } from '$lib/format';
import type { IEncryptionPrivateKey, IFile, IUploadProgress } from '$lib/types';
import type { Payload as AltchaPayload, Challenge as AltchaChallenge } from 'altcha-lib/types';

const replaceVariablesFormatters = {
	bytes: (str: string | number, decimals?: number) => formatBytes(+str, decimals),
	date: (str: string | number, tz?: string, locale?: string) => formatDate(str, tz, locale),
	datetime: (str: string | number, tz?: string, locale?: string) => formatDateTime(str, tz, locale),
	header: (str: string) => String(str).replace(/\r?\n/g, '').trim(),
	number: (str: string | number, locale?: string) => formatNumber(+str, locale),
	price: (str: string | number, currency: string, locale?: string) =>
		formatPrice(+str, currency, locale),
	trim: (str: string) => String(str).trim()
};

export async function copyToClipboard(text: string) {
	if ('clipboard' in navigator) {
		await navigator.clipboard.writeText(text);
		return true;
	}
	return false;
}

export function clone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

export function randomBytes(len: number) {
	const result = new Uint8Array(len);
	crypto.getRandomValues(result);
	return result;
}

export function randomInt(min: number, max: number) {
	const result = new Uint32Array(1);
	crypto.getRandomValues(result);
	const num = result[0] / (0xffffffff + 1);
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(num * (max - min + 1)) + min;
}

export function generatePassword(len: number, patterns: RegExp[] = [/[a-zA-Z0-9]/]) {
	return [...new Array(len)]
		.map((_, i) => {
			while (true) {
				const char = String.fromCharCode(randomBytes(1)[0]);
				if ((patterns[i] || patterns[patterns.length - 1]).test(char)) {
					return char;
				}
			}
		})
		.join('');
}

export function isMobile(): boolean {
	return (
		// @ts-expect-error mobile not defined
		('userAgentData' in navigator && navigator.userAgentData?.mobile) || window.innerWidth < 1000
	);
}

export function getTimeZone() {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch {
		// noop
	}
}

export function timeZoneToCountryCode(timezone?: string) {
	if (!timezone) {
		return void 0;
	}
	let record = TIMEZONES.find(([_, tz]) => tz === timezone);
	if (!record) {
		const [_, city] = timezone.split('/');
		if (city) {
			record = TIMEZONES.find(([_, tz]) => tz.endsWith(city));
		}
	}
	return record?.[0]?.toLowerCase();
}

export function parseInputOptions(
	options: string | string[] | { disabled?: boolean; label: string; value: string }[] | undefined,
	defaultOptions: typeof options = []
) {
	if (options === void 0) {
		options = defaultOptions;
	}
	if (typeof options === 'string') {
		options = options
			.split(/(?<!\\),|\r?\n/)
			.map((item) => item.trim())
			.filter((item) => !!item)
			.map((item) => item.replace(/\\,/, ','));
	}
	options = options.map((item) => {
		if (typeof item === 'string') {
			return {
				label: item,
				value: item
			};
		}
		return item;
	});
	return options.map(({ disabled, label, value }) => {
		return {
			disabled,
			label: label.startsWith('$_') ? get(_)(label.slice(2)) : label,
			value
		};
	});
}

export function base64Decode(b64: string, urlSafe: boolean = false) {
	if (urlSafe) {
		b64 = b64.replace(/_/g, '/').replace(/-/g, '+') + '='.repeat(3 - ((3 + b64.length) % 4));
	}
	return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function base64Encode(ua: Uint8Array, urlSafe: boolean = false) {
	const b64 = btoa(String.fromCharCode(...ua));
	if (urlSafe) {
		return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	}
	return b64;
}

export async function decryptData(
	encryptedData: string,
	keyHash: string,
	keys: IEncryptionPrivateKey[] | null = []
) {
	const key = keys?.find(({ id }) => id === keyHash);
	if (key) {
		const privateKey = await rsa.importPrivateKeyPem(key.privateKey);
		return JSON.parse(
			new TextDecoder().decode(await cipher.decrypt(privateKey, base64Decode(encryptedData)))
		);
	}
	return null;
}

export async function importPrivateKey(privateKeyPEM: string) {
	try {
		const id = await getPrivateKeyId(privateKeyPEM);
		encryptionKeys.set([
			{ id, privateKey: privateKeyPEM },
			...(get(encryptionKeys) || []).filter((key) => key.id !== id)
		]);
	} catch {
		// noop
	}
}

export async function getPrivateKeyId(privateKeyPEM: string) {
	const key = await rsa.importPrivateKeyPem(privateKeyPEM);
	return rsa.getPublicKeyId(await rsa.exportPublicKeyFromPrivateKey(key));
}

export function wrapLines(str: string, lineWidth: number = 80) {
	let result = '';
	while (str.length > 0) {
		result += str.slice(0, lineWidth) + '\n';
		str = str.slice(lineWidth);
	}
	return result;
}

export function isValidPublicKey(publicKey: string) {
	return (
		publicKey.startsWith('-----BEGIN PUBLIC KEY-----') &&
		publicKey.endsWith('-----END PUBLIC KEY-----')
	);
}

export function isValidPrivateKey(publicKey: string) {
	return (
		publicKey.startsWith('-----BEGIN PRIVATE KEY-----') &&
		publicKey.endsWith('-----END PRIVATE KEY-----')
	);
}

export function getDeviceName() {
	try {
		if ('userAgentData' in navigator) {
			// @ts-expect-error userAgentData unknown
			const mobile = !!navigator.userAgentData.mobile;
			// @ts-expect-error userAgentData unknown
			const platform = navigator.userAgentData.platform;
			// @ts-expect-error userAgentData unknown
			const brands: { brand: string }[] = navigator.userAgentData.brands || [];
			const model = brands.find(
				({ brand }) => !['Not A)Brand', 'Not/A)Brand', 'Not A;Brand'].includes(brand)
			)?.brand;
			if (platform) {
				return [platform, model, mobile ? '(mobile)' : ''].filter((p) => !!p).join(' ');
			}
		} else if (navigator.userAgent) {
			return navigator.userAgent.split(/\s/).pop()?.split('/')[0];
		}
	} catch {
		// noop
	}
	return 'Unknown';
}

export function forceDownload(
	contents: string | ArrayBufferLike,
	filename: string,
	type: string = 'text/plain'
) {
	const blob = new Blob([contents as ArrayBuffer], { type });
	const a = document.createElement('a');
	a.setAttribute('download', filename);
	a.setAttribute('href', URL.createObjectURL(blob));
	a.click();
}

export function shortenFormId(formId: string) {
	return formId.replace('form_', '');
}

export function normalizeFormId(formId: string) {
	return formId.startsWith('form_') ? formId : 'form_' + formId;
}

export function stringifyBlockValue(value: unknown) {
	if (value && typeof value === 'object') {
		return '—';
	}
	return value === void 0 || value === null || value === '' ? '—' : String(value);
}

export async function uploadFile(
	file: File,
	uploadUrl: string,
	altcha?: AltchaPayload
): Promise<string | null> {
	const type = file.type || 'application/octet-stream';
	const progress: IUploadProgress = {
		aborted: false,
		abort: () => {
			progress.aborted = true;
			uploadProgress.set(get(uploadProgress));
		},
		file,
		loaded: 0
	};
	uploadProgress.set([...get(uploadProgress).filter((p) => p.file !== file), progress]);
	const headers: Record<string, string> = {
		'content-type': 'application/json'
	};
	if (altcha) {
		headers['authorization'] = `Altcha payload=${JSON.stringify(altcha)}`;
	}
	const resp = await fetch(uploadUrl, {
		body: JSON.stringify({
			name: file.name,
			size: file.size,
			type
		}),
		headers,
		method: 'POST'
	});
	if (resp.status === 401 && !altcha) {
		const auth = resp.headers.get('www-authenticate');
		if (auth && !altcha) {
			const solution = await solveAltcha(auth);
			if (solution) {
				return uploadFile(file, uploadUrl, solution);
			}
		}
		return null;
	} else if (resp.status !== 200) {
		progress.error = String(resp.status);
		uploadProgress.set(get(uploadProgress));
		throw new Error('File upload failed.');
	}
	const json = await resp.json();
	if (json?.uploadUrl && !progress.aborted) {
		let body: File | Uint8Array = file;
		if (json.encrypted && json.encryptionPublicKey) {
			const publicKey = await rsa.importPublicKeyPem(json.encryptionPublicKey);
			const response = new Response(
				new ReadableStream({
					async start(controller) {
						const reader = file.stream().getReader();
						while (true) {
							const { done, value } = await reader.read();
							if (done) {
								break;
							}
							controller.enqueue(value);
						}
						controller.close();
					}
				})
			);
			const buffer = await response.arrayBuffer();
			body = await cipher.encrypt(publicKey, new Uint8Array(buffer));
		}
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			progress.abort = () => {
				xhr.abort();
				progress.aborted = true;
				uploadProgress.set(get(uploadProgress));
			};
			xhr.upload.addEventListener('progress', (ev) => {
				progress.loaded = ev.loaded;
				uploadProgress.set(get(uploadProgress));
			});
			xhr.addEventListener('error', (ev) => {
				console.error('Upload failed', ev);
				reject(new Error('Upload failed.'));
			});
			xhr.addEventListener('load', () => {
				finalizeFileUpload(json.fileId, {
					encryptedSize: json.encrypted && body instanceof Uint8Array ? body.length : void 0
				}).then(() => {
					resolve(json?.fileId || null);
				}, reject);
			});
			xhr.open('PUT', json.uploadUrl);
			xhr.setRequestHeader('content-type', type);
			xhr.send(body);
		});
	}
	return null;
}

export async function finalizeFileUpload(
	fileId: string,
	data: Partial<Pick<IFile, 'encryptedSize'>> = {}
) {
	const resp = await fetch(`/storage/${fileId}/finalize`, {
		body: JSON.stringify(data),
		headers: {
			'content-type': 'application/json'
		},
		method: 'POST'
	});
	if (resp.status > 204) {
		throw new Error(`Server responded with ${resp.status}.`);
	}
	return true;
}

export async function downloadFile(
	file: Pick<IFile, 'id' | 'encrypted' | 'encryptionKeyHash'>,
	onProgress?: (bytesLoaded: number, totalBytes: number) => void
) {
	const downloadUrl = `/storage/${file.id}?download=1`;
	const resp = await fetch(downloadUrl);
	const contentLength = resp.headers.get('content-length');
	const bytesTotal = contentLength ? parseInt(contentLength, 10) : 0;
	let bytesLoaded = 0;
	if (resp.status !== 200) {
		throw new Error(`Server responded with ${resp.status}.`);
	}
	const response = new Response(
		new ReadableStream({
			async start(controller) {
				const reader = resp.body!.getReader();
				while (true) {
					const { done, value } = await reader.read();
					if (done) {
						break;
					}
					bytesLoaded = bytesLoaded + value.byteLength;
					onProgress?.(bytesLoaded, bytesTotal);
					controller.enqueue(value);
				}
				controller.close();
			}
		})
	);
	const buffer = await response.arrayBuffer();
	const key = get(encryptionKeys).find(({ id }) => id === file.encryptionKeyHash);
	if (!key) {
		throw new Error(`Failed to decrypt file (encryption key ${file.encryptionKeyHash}).`);
	}
	const privateKey = await rsa.importPrivateKeyPem(key.privateKey);
	const result = await cipher.decrypt(privateKey, new Uint8Array(buffer));
	return result.buffer;
}

export async function solveAltcha(header: string) {
	const parts = header.split(' ');
	const challenge = parts.find((p) => p.startsWith('challenge='))?.slice(10, -1);
	if (challenge) {
		const parsed = JSON.parse(challenge) as AltchaChallenge;
		const solution = await solveChallengeWorkers(
			() => new InlineAltchaWorker(),
			navigator.hardwareConcurrency || 8,
			parsed.challenge,
			parsed.salt,
			parsed.algorithm,
			parsed.maxnumber
		);
		if (solution) {
			return {
				...parsed,
				number: solution.number
			};
		}
	}
}

export function debounce<T extends (...args: never[]) => unknown>(fn: T, delay: number) {
	let timer: Timer | null = null;
	return ((...args: never[]) => {
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout(() => {
			fn(...args);
		}, delay);
	}) as T;
}

export function throttle<T extends (...args: never[]) => unknown>(fn: T, delay: number) {
	let timer: Timer | null = null;
	return ((...args: never[]) => {
		if (timer === null) {
			fn(...args);
			timer = setTimeout(() => {
				timer = null;
			}, delay);
		}
	}) as T;
}

export function camelToSnakeCase(str: string) {
	return str.replace(/[A-Z]/g, (s) => `_${s.toLowerCase()}`);
}

export function matchesFileType(allowedTypes: string[] | string, file: File) {
	if (typeof allowedTypes === 'string') {
		allowedTypes = allowedTypes.split(/\s+|,|;/);
	}
	if (allowedTypes?.length) {
		const ext = file.name.slice(file.name.lastIndexOf('.')).toLocaleLowerCase();
		return allowedTypes.some((type: string) => {
			if (type.endsWith('/*') && file.type.startsWith(type.slice(0, -1))) {
				return true;
			}
			if (file.type === type) {
				return true;
			}
			if (ext === '.jpeg' && type === '.jpg') {
				return true;
			}
			return ext === type;
		});
	}
	return true;
}

export function replaceVariables(
	str: string,
	vars: Record<string, unknown>,
	formatters = replaceVariablesFormatters
) {
	return str.replace(/\{([^}]+)\}/g, (match, expr: string) => {
		const [variable, formatter, ...rest] = expr.split(/[\s|]+/) || [];
		let params = rest;
		let result = match;
		if (variable?.startsWith('$.')) {
			result = resolveProp(vars, variable.slice(2));
		}
		if (formatter && formatters[formatter as keyof typeof formatters]) {
			if (params.length) {
				params = params.map((param) => {
					if (param.startsWith('$.')) {
						return resolveProp(vars, param.slice(2));
					}
					return param;
				});
			}
			try {
				// @ts-expect-error formatters parameters
				result = formatters[formatter as keyof typeof formatters](result, ...params);
			} catch (err) {
				// noop
			}
		}
		return result;
	});
}

export function resolveProp(
	vars: Record<string, unknown>,
	prop: string,
	formatter: (value: unknown) => string = (str) => String(str)
) {
	const keys = prop.split('.');
	let tmp: Record<string, unknown> | unknown = vars;
	for (let i = 0; i < keys.length; i++) {
		tmp = typeof tmp === 'object' && tmp ? tmp[keys[i] as keyof typeof tmp] : void 0;
		if (tmp === void 0 || typeof tmp === 'string') {
			break;
		}
	}
	return tmp === void 0 ? '$.' + prop : formatter(tmp);
}
