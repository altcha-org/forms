import { debounce, getTimeZone, isMobile } from '$lib/helpers';

export interface ISessionOptions {
  form: HTMLFormElement;
  beaconUrl?: string;
  onBeforeSubmit?: () => void;
}

export class Session {
  currentFieldName: string | null = null;

  error: string | null = null;

  readonly fields: Record<string, {
    duration: number;
    changes: number;
    startTime: number;
  }> = {};

  readonly loadTime: number = Date.now();

  submitTime: number | null = null;

  startTime: number | null = null;
  
  readonly viewThresholdMs: number = 3000;

  readonly _onFormChange = this.onFormChange.bind(this);

  readonly _onFormFocus = debounce(this.onFormFocus.bind(this), 250);

  readonly _onFormSubmit = this.onFormSubmit.bind(this);

  readonly _onUnload = this.onUnload.bind(this);

  constructor(
    readonly options: ISessionOptions,
  ) {
    window.addEventListener('unload', this._onUnload);
    this.options.form.addEventListener('change', this._onFormChange);
    this.options.form.addEventListener('focusin', this._onFormFocus);
    this.options.form.addEventListener('submit', this._onFormSubmit);
  }

  data() {
    return {
      error: !!this.error,
      fields: Object.entries(this.fields).map(([ name, { changes, duration, startTime }]) => {
        return [name, startTime, duration, changes];
      }),
      start: this.startTime,
      submit: this.submitTime,
    };
  }

  dataToUrlString() {
    const data = this.data();
    return new URLSearchParams({
      error: String(data.error),
      fields: JSON.stringify(data.fields),
      start: String(data.start || ''),
      submit: String(data.submit || ''),
    }).toString();
  }

  destroy() {
    window.removeEventListener('unload', this._onUnload);
    this.options.form.removeEventListener('change', this._onFormChange);
    this.options.form.removeEventListener('focusin', this._onFormFocus);
    this.options.form.removeEventListener('submit', this._onFormSubmit);
  }

  end() {
    this.submitTime = Date.now();
    this.sendData();
  }

  isInput(el: HTMLElement) {
    return ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
  }

  onFormFieldChange(el: HTMLInputElement) {
    const name = el.getAttribute('name');
    if (name) {
      this.trackFieldChange(name);
    }
  }

  onFormFieldFocus(el: HTMLInputElement) {
    const name = el.getAttribute('name');
    if (name) {
      if (this.currentFieldName && this.currentFieldName !== name) {
        this.trackFieldBlur(this.currentFieldName);
      }
      this.currentFieldName = name;
      this.trackFieldFocus(name);
      const onBlur = () => {
        this.trackFieldBlur(name);
        el.removeEventListener('blur', onBlur);
      };
      requestAnimationFrame(() => {
        el.addEventListener('blur', onBlur);
      });
    }
  }

  onFormChange(ev: Event) {
    const target = ev.target as HTMLInputElement | null;
    if (target && this.isInput(target)) {
      this.onFormFieldChange(target);
    }
  }

  onFormFocus(ev: FocusEvent) {
    const target = ev.target as HTMLInputElement | null;
    if (!this.startTime) {
      this.start();
    }
    if (target && this.isInput(target)) {
      this.onFormFieldFocus(target);
    }
  }

  onFormSubmit() {
    this.end();
    this.options.onBeforeSubmit?.();
  }

  onUnload() {
    this.sendData();
  }

  async sendData() {
    if (this.loadTime <= (Date.now() - this.viewThresholdMs) && !this.submitTime && this.options.beaconUrl && 'sendBeacon' in navigator) {
      const url = new URL(this.options.beaconUrl, location.origin);
      url.searchParams.set('tz', getTimeZone() || '');
      url.searchParams.set('mobile', isMobile() ? '1' : '0');
      navigator.sendBeacon(url, JSON.stringify(this.data()));
    }
  }

  start() {
    this.startTime = Date.now();
  }

  trackError(err: string) {
    this.error = String(err);
  }

  trackFieldBlur(name: string) {
    if (this.fields[name] && !this.fields[name].duration) {
      this.fields[name].duration = Date.now() - this.fields[name].startTime;
    }
  }

  trackFieldFocus(name: string) {
    if (!this.fields[name]) {
      this.fields[name] = {
        duration: 0,
        changes: 0,
        startTime: Date.now(),
      };
    }
  }

  trackFieldChange(name: string) {
    if (this.fields[name]) {
      this.fields[name].changes += 1;
    }
  }
}
