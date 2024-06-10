import { CronJob } from 'cron';
import { env } from '$lib/server/env';
import { responsesService } from '$lib/server/services/responses.service';
import { filesService } from '$lib/server/services/files.service';
import { devicesService } from '$lib/server/services/devices.service';

const AUTO_START = env.JOBS_DISABLED !== '1';

export const removeExpiredDevices = env.JOBS_DELETE_EXPIRED_DEVICED
	? CronJob.from({
			cronTime: env.JOBS_DELETE_EXPIRED_DEVICED,
			onTick: async () => {
				await devicesService.deleteExpiredDevices();
			},
			start: AUTO_START
		})
	: null;

export const removeExpiredResponses = env.JOBS_DELETE_EXPIRED_RESPONSES
	? CronJob.from({
			cronTime: env.JOBS_DELETE_EXPIRED_RESPONSES,
			onTick: async () => {
				await responsesService.deleteExpiredResponses();
			},
			start: AUTO_START
		})
	: null;

export const removeExpiredFiles = env.JOBS_DELETE_EXPIRED_FILES
	? CronJob.from({
			cronTime: env.JOBS_DELETE_EXPIRED_FILES,
			onTick: async () => {
				await filesService.deleteExpiredFiles();
			},
			start: AUTO_START
		})
	: null;
