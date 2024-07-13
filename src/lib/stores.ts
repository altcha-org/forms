import { get, writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import { aes } from '@altcha/crypto';
import { base64Decode, base64Encode } from '$lib/helpers';
import type {
	IEncryptionPrivateKey,
	IDevice,
	IForm,
	IUploadProgress,
	TResponseData
} from '$lib/types';

type IDevicePartial = Pick<IDevice, 'id' | 'name' | 'encryptionKey'>;

const PERSISTENT_STORE_PREFIX = 'persistent_store';

const persistentStoreWritables: Record<string, Writable<unknown>> = {};

let persistentStoreData: Record<string, unknown> = {};
let persistentStoreLoaded: boolean = false;
let persistentStoreDeviceId: string | null = null;
let persistentStoreKey: CryptoKey | null = null;
let persistentStoreName: string | null = null;

export const dashboardSidebarOpen = writable<boolean>(
	browser ? localStorage.getItem('dashboard_sidebar_open') !== '0' : true
);
export const darkTheme = writable<boolean>(
	browser ? localStorage.getItem('dark_theme') === '1' : false
);
export const device = writable<IDevicePartial | undefined>(void 0);
export const form = writable<IForm>(void 0);
export const formExport = writable<boolean>(false);
export const formExportResponses = writable<string[]>([]);
export const formPreview = writable<boolean>(false);
export const language = writable<string | null>(browser ? localStorage.getItem('language') : null);
export const responseDataPromise = writable<Promise<TResponseData>>(void 0);
export const uploadProgress = writable<IUploadProgress[]>([]);
export const uploadPromise = writable<Promise<boolean> | undefined>(void 0);
export const encryptionKeys = persistentWritable<IEncryptionPrivateKey[]>('encryption_keys', []);

export function closePersistentStore() {
	persistentStoreData = {};
	persistentStoreLoaded = false;
	persistentStoreDeviceId = null;
	persistentStoreKey = null;
	persistentStoreName = null;
	for (const name in persistentStoreWritables) {
		persistentStoreWritables[name].set(null);
	}
}

device.subscribe((value) => {
	if (value && persistentStoreDeviceId !== value.id) {
		initPersistentStore(value);
	} else if (!value) {
		closePersistentStore();
	}
});

darkTheme.subscribe((value) => {
	if (browser && value !== null) {
		localStorage.setItem('dark_theme', value ? '1' : '0');
	}
});

dashboardSidebarOpen.subscribe((value) => {
	if (browser && value !== null) {
		localStorage.setItem('dashboard_sidebar_open', value ? '1' : '0');
	}
});

language.subscribe((value) => {
	if (browser && value) {
		localStorage.setItem('language', value);
	}
});

uploadProgress.subscribe((value) => {
	const promise = get(uploadPromise);
	if (value?.length) {
		if (!promise) {
			uploadPromise.set(
				new Promise((resolve, reject) => {
					uploadProgress.subscribe((_uploadProgress) => {
						const errored = _uploadProgress.some(({ error }) => !!error);
						const uploading = _uploadProgress.some(
							({ error, file, loaded }) => !error && file.size > loaded
						);
						if (errored) {
							reject(new Error('Upload failed.'));
						} else if (!uploading) {
							resolve(true);
						}
					});
				})
			);
		}
	} else if (promise) {
		uploadPromise.set(void 0);
	}
});

async function initPersistentStore(device: IDevicePartial) {
	persistentStoreDeviceId = device.id;
	persistentStoreName = PERSISTENT_STORE_PREFIX + '_' + device.id;
	persistentStoreKey = await aes.importKey(base64Decode(device.encryptionKey));
	const data = localStorage.getItem(persistentStoreName);
	if (data) {
		try {
			const [iv, payload] = data.split('.');
			persistentStoreData = JSON.parse(
				new TextDecoder().decode(
					await aes.decrypt(persistentStoreKey, base64Decode(payload), base64Decode(iv))
				)
			);
		} catch (err) {
			console.log('Failed to decrypt persistent data store', err);
			localStorage.removeItem(persistentStoreName);
		}
		for (const name in persistentStoreWritables) {
			if (persistentStoreData[name] !== void 0) {
				persistentStoreWritables[name].set(persistentStoreData[name]);
			}
		}
	}
	persistentStoreLoaded = true;
}

async function writePeristentStore() {
	if (persistentStoreName && persistentStoreKey) {
		try {
			const { encrypted, iv } = await aes.encrypt(
				persistentStoreKey,
				new TextEncoder().encode(JSON.stringify(persistentStoreData))
			);
			localStorage.setItem(persistentStoreName, base64Encode(iv) + '.' + base64Encode(encrypted));
		} catch (err) {
			console.log('Failed to write persistent data store', err);
		}
	}
}

function persistentWritable<T>(name: string, defaultValue?: T) {
	const store = writable<T>((persistentStoreData[name] || defaultValue) as T);
	let loaded = false;
	store.subscribe((value) => {
		if (loaded) {
			persistentStoreData[name] = value;
			if (persistentStoreLoaded) {
				writePeristentStore();
			}
		}
	});
	persistentStoreWritables[name] = store;
	loaded = true;
	return store;
}
