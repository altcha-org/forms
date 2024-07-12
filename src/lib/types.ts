import type { ComponentType } from 'svelte';
import type { IForm } from '$lib/server/services/forms.service';
import type { AuthenticatorDevice } from '@simplewebauthn/types';

export type { IAccount } from '$lib/server/services/accounts.service';
export type { IDevice } from '$lib/server/services/devices.service';
export type { IAuditlogEvent, IAuditlogEventListItem } from '$lib/server/services/auditlog.service';
export type { IFile, IFileWithoutAccount } from '$lib/server/services/files.service';
export type { IForm } from '$lib/server/services/forms.service';
export type { IResponse, IResponseListItem } from '$lib/server/services/responses.service';
export type { IPlan } from '$lib/server/services/plans.service';
export type { IIdentity } from '$lib/server/services/identities.service';

export enum EUserRole {
	ADMIN = 'admin',
	MEMBER = 'member'
}

export enum EFormStatus {
	ARCHIVED = 'archived',
	DRAFT = 'draft',
	PUBLISHED = 'published'
}

export enum EComplexity {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high'
}

export interface IFormBlock<TOptions extends Record<string, unknown> = Record<string, unknown>> {
	default?: string;
	help?: string;
	hidden?: boolean;
	if?: string;
	label?: string;
	name: string;
	options: TOptions;
	placeholder?: string;
	readonly?: boolean;
	required?: boolean;
	size?: 'xs' | 'sm' | 'md' | 'full';
	type: string;
}

export type IFormBlockPartial<TOptions extends Record<string, unknown> = Record<string, unknown>> = Omit<IFormBlock, 'options' | 'type'> &
	Partial<Pick<IFormBlock<TOptions>, 'options' | 'type'>>;

export interface IFormStep {
	blocks: IFormBlock[];
	text?: string;
	title?: string;
}

export interface IFormProcessor<Config = unknown> {
	config: Config;
	description?: string;
	enabled: boolean;
	type: string;
}

export interface IBlockDefinition {
	icon: string;
	options?: IFormBlock[];
	premium?: boolean;
	type: string;
}

export interface IPlanPrice {
	amount: number;
	currency: string;
	period: 'month' | 'year';
	priceId?: string;
}

export interface IFormTemplate extends Pick<Partial<IForm>, 'banner' | 'logo' | 'name' | 'steps'> {
	categories?: string[];
	description: string;
	id: string;
	premium?: boolean;
	sort?: number;
}

export interface IProcessor {
	configSchema: IFormBlock[];
	type: string;
}

export interface IUploadProgress {
	aborted: boolean;
	abort: () => void;
	error?: string;
	file: File;
	loaded: number;
}

export interface IEncryptionPrivateKey {
	id: string;
	privateKey: string;
}

export interface IEncryptionPublicKey {
	alg: string;
	key_ops: string[];
	n: string;
}

export interface IReponseLogEntry {
	data?: Record<string, unknown>;
	error?: boolean;
	time: number;
	text: string;
}

export type TResponseData = Record<string, unknown>;

export type WebAuthnAuthenticator = Omit<
	AuthenticatorDevice,
	'credentialID' | 'credentialPublicKey'
> & {
	credentialID: string;
	credentialPublicKey: string;
	credentialDeviceType: string;
	credentialBackedUp: boolean;
	deviceName?: string;
};

export interface ITab {
	badge?: string | number | boolean | Promise<string | number | boolean>;
	badgeColor?: string;
	disabled?: boolean;
	hidden?: boolean;
	href?: string;
	icon?: ComponentType;
	label: string;
	value?: string;
}

export interface IPaginationOptions {
	offset: number;
	limit: number;
}

export interface IOrderByOptions {
	orderBy: string | null;
	orderDir: 'asc' | 'desc' | null;
}

export interface ILabel {
	color: string;
	label: string;
}

export interface IBarChartItem {
	label: string;
	value: number[];
}

export interface IPdfInputOptions {
	elements: IPdfInputElement[];
	fileId: string | null;
	fileName: string | null;
	fontColor: string;
	fontFamily: string;
	fontSize: string;
}

export interface IPdfInputElement {
	computed?: string;
	height: number;
  id: string;
	name?: string;
	page: number;
	pageHeight: number;
	pageWidth: number;
	x: number;
	y: number;
	width: number;
}