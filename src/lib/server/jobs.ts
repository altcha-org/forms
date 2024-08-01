import { CronJob } from 'cron';
import { env } from '$lib/server/env';
import { logger } from '$lib/server/logger';
import { responsesService } from '$lib/server/services/responses.service';
import { filesService } from '$lib/server/services/files.service';
import { devicesService } from '$lib/server/services/devices.service';
import { sessionsService } from './services/sessions.service';
import { accountsService } from './services/accounts.service';
import { acquireLock, releaseLock } from './redis';

const AUTO_START = env.JOBS_DISABLED !== '1';

export const removeExpiredDevices = env.JOBS_DELETE_EXPIRED_DEVICED
	? CronJob.from({
			cronTime: env.JOBS_DELETE_EXPIRED_DEVICED,
			onTick: async () =>
				processJob('removeExpiredDevices', async () => {
					await devicesService.deleteExpiredDevices();
				}),
			start: AUTO_START
		})
	: null;

export const removeExpiredResponses = env.JOBS_DELETE_EXPIRED_RESPONSES
	? CronJob.from({
			cronTime: env.JOBS_DELETE_EXPIRED_RESPONSES,
			onTick: async () =>
				processJob('removeExpiredResponses', async () => {
					await responsesService.deleteExpiredResponses();
				}),
			start: AUTO_START
		})
	: null;

export const removeExpiredFiles = env.JOBS_DELETE_EXPIRED_FILES
	? CronJob.from({
			cronTime: env.JOBS_DELETE_EXPIRED_FILES,
			onTick: async () =>
				processJob('removeExpiredFiles', async () => {
					await filesService.deleteExpiredFiles();
				}),
			start: AUTO_START
		})
	: null;

export const compactSessions = env.JOBS_COMPACT_SESSIONS
	? CronJob.from({
			cronTime: env.JOBS_COMPACT_SESSIONS,
			onTick: async () =>
				processJob('compactSessions', async () => {
					await sessionsService.compactSessions();
				}),
			start: AUTO_START
		})
	: null;

export const suspendExpiredTrialsAccounts = env.JOBS_SUSPEND_EXPIRED_TRIALS
	? CronJob.from({
			cronTime: env.JOBS_SUSPEND_EXPIRED_TRIALS,
			onTick: async () =>
				processJob('suspendExpiredTrialsAccounts', async () => {
					await accountsService.suspendExpiredTrials();
				}),
			start: AUTO_START
		})
	: null;

async function processJob(name: string, fn: () => Promise<void> | void, unlock: boolean = false) {
	const lockKey = `job:${name}`;
	logger.info('Executing job %s', name);
	let lock: boolean | null = null;
	const start = performance.now();
	try {
		lock = await acquireLock(lockKey);
		if (lock !== false) {
			await fn();
			logger.info('Job %s executed in %d ms', name, Math.floor((performance.now() - start) * 10) / 10);
		} else {
			logger.info('Job %s skipped due to present lock.', name);
		}
	} catch (err) {
		logger.error(err, 'Job %s failed.', name);
	} finally {
		if (lock && unlock) {
			// Don't unlock by default, even short running jobs should be processed only once per cron execution
			await releaseLock(lockKey);
		}
	}
}
