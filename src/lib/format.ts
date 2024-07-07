const timeUnits: Record<string, number> = {
	year: 24 * 60 * 60 * 1000 * 365,
	month: (24 * 60 * 60 * 1000 * 365) / 12,
	day: 24 * 60 * 60 * 1000,
	hour: 60 * 60 * 1000,
	minute: 60 * 1000,
	second: 1000
};

export function formatBytes(bytes: number | null | undefined, decimals: number = 2) {
	if (!bytes || bytes === 0) {
		return '0 Bytes';
	}
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatNumber(num: number, locale?: string) {
	return new Intl.NumberFormat(locale).format(num);
}

export function formatPrice(num: number, currency: string, locale?: string) {
	return new Intl.NumberFormat(locale, {
		currency,
		style: 'currency'
	})
		.format(num)
		.replace(/[\,\.]00$/, '');
}

export function formatDate(
	date?: Date | number | string,
	tz?: string | null,
	locale?: string,
	options?: Intl.DateTimeFormatOptions
): string {
	if (!date) {
		return '';
	}
	date = new Date(date);
	return new Intl.DateTimeFormat(locale, {
		...options,
		timeZone: tz || void 0
	}).format(date.getTime());
}

export function formatDateTime(
	date?: Date | number | string,
	tz?: string | null,
	locale?: string,
	options?: Intl.DateTimeFormatOptions
): string {
	if (!date) {
		return '';
	}
	date = new Date(date);
	return new Intl.DateTimeFormat(locale, {
		dateStyle: 'short',
		timeStyle: 'short',
		timeZone: tz || void 0,
		...options
	}).format(date.getTime());
}

export function formatDuration(duration: number): string {
	const date = new Date(0);
	date.setMilliseconds(duration);
	return date.toISOString().substring(11, 19);
}

export function formatTimeAgo(date?: Date | number | string, locale?: string) {
	if (!date) {
		return '';
	}
	const diff = new Date(date).getTime() - new Date().getTime();
	const relativeFormatter = new Intl.RelativeTimeFormat(locale, {
		numeric: 'auto'
	});
	for (const unit in timeUnits) {
		if (Math.abs(diff) > timeUnits[unit] || unit == 'second') {
			return relativeFormatter.format(Math.round(diff / timeUnits[unit]), unit as any);
		}
	}
	return new Date(date).toLocaleTimeString();
}

export function formatTimeShort(date?: Date | number | string, tz?: string, locale?: string) {
	if (!date) {
		return '';
	}
	date = new Date(date);
	const today = new Date();
	const isSameDay =
		date.getFullYear() === today.getFullYear() &&
		date.getMonth() === today.getMonth() &&
		date.getDate() === today.getDate();
	if (isSameDay) {
		return new Intl.DateTimeFormat(locale, {
			timeStyle: 'short',
			timeZone: tz || void 0
		}).format(date.getTime());
	}
	return new Intl.DateTimeFormat(locale, {
		dateStyle: 'short',
		timeZone: tz || void 0
	}).format(date.getTime());
}
