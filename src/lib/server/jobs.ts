import { CronJob } from 'cron';
import { env } from '$lib/server/env';
import { logger } from '$lib/server/logger';
import { responsesService } from '$lib/server/services/responses.service';
import { filesService } from '$lib/server/services/files.service';
import { devicesService } from '$lib/server/services/devices.service';
import { sessionsService } from './services/sessions.service';

const AUTO_START = env.JOBS_DISABLED !== '1';

export const removeExpiredDevices = env.JOBS_DELETE_EXPIRED_DEVICED
	? CronJob.from({
			cronTime: env.JOBS_DELETE_EXPIRED_DEVICED,
			onTick: async () => {
				logger.debug('Executing job removeExpiredDevices');
				try {
					await devicesService.deleteExpiredDevices();
				} catch (err) {
					logger.error(err, 'Job removeExpiredDevices failed.');
				}
			},
			start: AUTO_START
		})
	: null;

export const removeExpiredResponses = env.JOBS_DELETE_EXPIRED_RESPONSES
	? CronJob.from({
			cronTime: env.JOBS_DELETE_EXPIRED_RESPONSES,
			onTick: async () => {
				logger.debug('Executing job removeExpiredResponses');
				try {
					await responsesService.deleteExpiredResponses();
				} catch (err) {
					logger.error(err, 'Job removeExpiredResponses failed.');
				}
			},
			start: AUTO_START
		})
	: null;

export const removeExpiredFiles = env.JOBS_DELETE_EXPIRED_FILES
	? CronJob.from({
			cronTime: env.JOBS_DELETE_EXPIRED_FILES,
			onTick: async () => {
				logger.debug('Executing job removeExpiredResponses');
				try {
					await filesService.deleteExpiredFiles();
				} catch (err) {
					logger.error(err, 'Job removeExpiredResponses failed.');
				}
			},
			start: AUTO_START
		})
	: null;

export const compactSessions = env.JOBS_COMPACT_SESSIONS
	? CronJob.from({
			cronTime: env.JOBS_COMPACT_SESSIONS,
			onTick: async () => {
				logger.debug('Executing job compactSessions');
				try {
					await sessionsService.compactSessions();
				} catch (err) {
					logger.error(err, 'Job compactSessions failed.');
				}
			},
			start: AUTO_START
		})
	: null;
