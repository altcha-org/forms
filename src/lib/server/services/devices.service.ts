import { eq, lt } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { db } from '$lib/server/db';
import { env } from '$lib/server/env';
import { devices } from '$lib/server/db/schema';
import { EIdPrefix, idgen } from '$lib/server/id';

export type IDevice = NonNullable<Awaited<ReturnType<DevicesService['findDevice']>>>;

export type IDeviceSchema = typeof devices.$inferSelect;

export class DevicesService {
	readonly columns = {
		createdAt: true,
		encryptionKey: true,
		id: true,
		ipAddress: true,
		name: true,
		timezone: true,
		updatedAt: true,
		userId: true
	} as const satisfies Partial<Record<keyof IDeviceSchema, boolean>>;

	generateId() {
		return idgen.prefixed(EIdPrefix.DEVICE);
	}

	generateJWT(device: Pick<IDevice, 'id'>, expiresIn: string | number = '90d') {
		return jwt.sign({}, env.SIGNING_SECRET, {
			expiresIn,
			issuer: env.JWT_ISSUER,
			subject: String(device.id)
		});
	}

	verifyJWT(token: string) {
		const { sub, exp, iat } = jwt.verify(token, env.SIGNING_SECRET, {
			issuer: env.JWT_ISSUER
		}) as jwt.JwtPayload;
		return {
			expire: exp,
			issued: iat,
			deviceId: sub
		};
	}

	async createDevice(
		data: Pick<
			IDeviceSchema,
			'encryptionKey' | 'expiresAt' | 'name' | 'ipAddress' | 'timezone' | 'userId'
		>
	) {
		const [result] = await db
			.insert(devices)
			.values({
				encryptionKey: data.encryptionKey,
				expiresAt: data.expiresAt,
				id: this.generateId(),
				ipAddress: data.ipAddress,
				name: data.name,
				timezone: data.timezone,
				userId: data.userId
			})
			.returning();
		return result;
	}

	async deleteDevice(deviceId: string) {
		await db.delete(devices).where(eq(devices.id, deviceId));
	}

	async deleteExpiredDevices() {
		await db.delete(devices).where(lt(devices.expiresAt, new Date()));
	}

	async findDevice(deviceId: string) {
		return db.query.devices.findFirst({
			columns: this.columns,
			where: eq(devices.id, deviceId)
		});
	}

	async listDevicesForUser(userId: string) {
		return db.query.devices.findMany({
			columns: this.columns,
			where: eq(devices.userId, userId)
		});
	}

	async updateDevice(
		deviceId: string,
		data: Partial<Pick<IDeviceSchema, 'expiresAt' | 'ipAddress' | 'name' | 'timezone'>>
	) {
		await db
			.update(devices)
			.set({
				name: data.name,
				ipAddress: data.ipAddress,
				timezone: data.timezone,
				expiresAt: data.expiresAt,
				updatedAt: new Date()
			})
			.where(eq(devices.id, deviceId));
	}
}

export const devicesService = new DevicesService();
