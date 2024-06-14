import { incrementAccountUsage } from '../redis';
import type { RequestEvent } from '@sveltejs/kit';

export default () => {
	return async (event: RequestEvent) => {
    if (event.locals.apiKey) {
      await incrementAccountUsage(event.locals.apiKey.account.id, event.locals.apiKey.id, event.locals.apiKeyReferrer);
    }
	};
};
