// See https://kit.svelte.dev/docs/types#app

import type { IAccount } from '$lib/server/services/accounts.service';
import type { IApiKey } from '$lib/server/services/apiKeys.service';
import type { IDevice } from '$lib/server/services/devices.service';
import type { IUser } from '$lib/server/services/users.service';

// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			status?: number;
		}
		interface Locals {
			account?: IAccount;
			apiKey?: IApiKey;
			apiKeyReferrer?: string;
			device?: IDevice;
			deviceId?: string;
			error?: unknown;
			i18n: (key: string, params?: { values: unknown }) => string;
			locale: string;
			remoteAddress: string;
			user?: IUser;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
