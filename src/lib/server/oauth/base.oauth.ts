export interface IOAuthProfile {
	avatar?: string;
	email: string;
	emailVerified: boolean;
	metadata?: Record<string, unknown>;
	name: string;
}

export abstract class BaseOAuth {
	abstract authorize(state?: URLSearchParams): Promise<{ authorizationUri: string }>;
	abstract callback(code: string): Promise<{
		accessToken: string;
		profile: IOAuthProfile;
	}>;
}
