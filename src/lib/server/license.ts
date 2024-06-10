import { base64Decode, base64Encode } from '@altcha/crypto/encoding';

export interface ILicense {
	id: string;
	subject: string;
	expiresAt: string;
	issuedAt: string;
}

export interface ILicensePayload {
	license: ILicense;
	publicKey: string;
	signature: string;
}

const KNOWN_PUBLIC_KEYS: string[] = [
	'BIvQ1adz2V71nazzatoZn9YIZUzAbfEAOfER6xEDC5zHB0xBfV6GnvYawgled5JiQHkP2PTClV/StNP9yYicUWg=',
	'BFdmaRv1kIO1uc9lxqght6gwpyF8yE67vVHfYclu6gFDXYzFWfbAa7nrl/8zv5AvlaABOlz8Iax2pHOmk2CzyRA='
];

export class License {
	data?: ILicense;

	payload?: ILicensePayload;

	valid: boolean = false;

	recheckTimeout?: Timer;

	async load(payload: string | ILicensePayload) {
		try {
			if (typeof payload === 'string') {
				if (payload.startsWith('{') && payload.endsWith('}')) {
					payload = JSON.parse(payload) as ILicensePayload;
				} else {
					payload = JSON.parse(new TextDecoder().decode(base64Decode(payload))) as ILicensePayload;
				}
			}
			this.payload = payload;
			await this.verify();
		} catch (err) {
			console.log('Unable to load license', err);
		}
	}

	protected async verify() {
		if (this.payload) {
			const { license, valid } = await verifyLicense(this.payload);
			this.data = license;
			this.valid = valid;
		} else {
			this.valid = false;
		}
	}
}

export const license = new License();

export async function verifyLicense(payload: ILicensePayload) {
	if (!KNOWN_PUBLIC_KEYS.includes(payload.publicKey)) {
		throw new Error('Invalid public key.');
	}
	const verified = await crypto.subtle.verify(
		{
			name: 'ECDSA',
			hash: { name: 'SHA-256' }
		},
		await importPublicKey(base64Decode(payload.publicKey)),
		base64Decode(payload.signature),
		new TextEncoder().encode(JSON.stringify(payload.license))
	);
	return {
		license: payload.license,
		valid: verified && new Date(payload.license.expiresAt) > new Date()
	};
}

export async function signLicense(license: ILicense, publicKey: CryptoKey, privateKey: CryptoKey) {
	const signature = new Uint8Array(
		await crypto.subtle.sign(
			{
				name: 'ECDSA',
				hash: { name: 'SHA-256' }
			},
			privateKey,
			new TextEncoder().encode(JSON.stringify(license))
		)
	);
	return {
		license,
		publicKey: base64Encode(await exportPublicKey(publicKey)),
		signature: base64Encode(signature)
	};
}

export async function generateKeyPair() {
	return crypto.subtle.generateKey(
		{
			name: 'ECDSA',
			namedCurve: 'P-256'
		},
		true,
		['sign', 'verify']
	);
}

export async function exportPublicKey(publicKey: CryptoKey) {
	return new Uint8Array(await crypto.subtle.exportKey('raw', publicKey));
}

export async function exportPrivateKey(privateKey: CryptoKey) {
	const jwk = await crypto.subtle.exportKey('jwk', privateKey);
	return base64Decode(jwk.d!, true);
}

export async function importPublicKey(publicKey: Uint8Array) {
	return crypto.subtle.importKey(
		'raw',
		publicKey,
		{
			name: 'ECDSA',
			namedCurve: 'P-256'
		},
		true,
		['verify']
	);
}

export async function importKeyPair(
	privateKey: Uint8Array,
	publicKey: Uint8Array
): Promise<CryptoKeyPair> {
	const importedPublicKey = await importPublicKey(publicKey);
	const jwk = await crypto.subtle.exportKey('jwk', importedPublicKey);
	const importedPrivateKey = await crypto.subtle.importKey(
		'jwk',
		{
			...jwk,
			d: base64Encode(privateKey),
			key_ops: ['sign']
		},
		{
			name: 'ECDSA',
			namedCurve: 'P-256'
		},
		true,
		['sign']
	);
	return {
		privateKey: importedPrivateKey,
		publicKey: importedPublicKey
	};
}
