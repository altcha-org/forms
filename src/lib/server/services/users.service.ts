import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import duration from 'parse-duration';
import { db } from '$lib/server/db';
import { env } from '$lib/server/env';
import { accountsToUsers, users } from '$lib/server/db/schema';
import { EIdPrefix, idgen } from '$lib/server/id';
import { accountsService } from '$lib/server/services/accounts.service';
import { ForbiddenError, ValidationError } from '$lib/server/errors';
import { i18n } from '$lib/i18n';
import { plansService } from './plans.service';
import { EEvents, eventsService } from './events.service';
import type { IDevice } from './devices.service';

export type IUser = NonNullable<Awaited<ReturnType<UsersService['findUser']>>>;

export type IUserSchema = typeof users.$inferSelect;

const RECOVERY_TOKEN_DELAY = duration(env.USER_RECOVERY_TOKEN_DELAY) || 600_000;
const RECOVERY_THROTTLE = duration(env.USER_RECOVERY_THROTTLE) || 3_600_000;

export class UsersService {
	readonly columns = {
		createdAt: true,
		deleted: true,
		deletedAt: true,
		email: true,
		emailVerified: true,
		emergency: true,
		id: true,
		jwtNonce: true,
		locale: true,
		name: true,
		oauthProvider: true,
		updatedAt: true
	} as const satisfies Partial<Record<keyof IUserSchema, boolean>>;

	generateJWTNonce() {
		return randomBytes(8).toString('hex').slice(0, 16);
	}

	generateEmailVerifyToken(randLength: number = 8) {
		return [Date.now(), randomBytes(randLength).toString('hex')].join('.');
	}

	generateRecoveryToken(randLength: number = 16) {
		return [Date.now() + RECOVERY_TOKEN_DELAY, randomBytes(randLength).toString('hex')].join('.');
	}

	async createUser(
		data: Pick<IUser, 'email' | 'locale'> &
			Partial<
				Pick<
					IUserSchema,
					| 'emailVerified'
					| 'emergency'
					| 'emergencyPassword'
					| 'name'
					| 'oauthProfile'
					| 'oauthAccessToken'
					| 'oauthProvider'
				>
			>,
		accountId?: string,
		role?: 'admin' | 'member',
		timeZone?: string | null
	) {
		const t = await i18n(data.locale);
		const name = data.name || data.email?.split(/[@+]/)[0] || '';
		const plan = await plansService.getDefaultPlan();
		let user: IUserSchema | undefined = void 0;
		try {
			const result = await db
				.insert(users)
				.values({
					email: data.email,
					emailVerified: data.emailVerified,
					emergency: data.emergency,
					emergencyPassword:
						data.emergency && data.emergencyPassword
							? await argon2.hash(data.emergencyPassword)
							: null,
					locale: data.locale,
					name,
					oauthProfile: data.oauthProfile,
					oauthAccessToken: data.oauthAccessToken,
					oauthProvider: data.oauthProvider,
					id: idgen.prefixed(EIdPrefix.USER),
					jwtNonce: this.generateJWTNonce(),
					webauthnAuthenticators: []
				})
				.returning();
			user = result[0];
		} catch (err) {
			if (
				typeof err === 'object' &&
				err &&
				'constraint_name' in err &&
				err.constraint_name === 'users_email_unique'
			) {
				throw new ValidationError(void 0, [
					{
						instancePath: '/email',
						message: t('error.email_already_registered')
					}
				]);
			}
			throw err;
		}
		if (!accountId) {
			const account = await accountsService.createAccount({
				name: t('text.users_account_name', { values: { name } }),
				plan,
				timeZone
			});
			accountId = account.id;
		}
		await db.insert(accountsToUsers).values({
			accountId,
			role,
			userId: user.id
		});
		if (!data.emailVerified) {
			await this.requestEmailVerification(user.id);
		}
		return user;
	}

	async deleteUser(userId: string, unsetPersonalData: boolean = true) {
		const user = await this.findUser(userId);
		if (!user || user.deleted) {
			return false;
		}
		for (const acc of user.accountsToUsers) {
			if (acc.role === 'admin') {
				const accUsers = await accountsService.listAccountUsers(acc.account.id);
				const hasOtherAdmins =
					user.emergency ||
					accUsers.some(({ role, userId }) => role === 'admin' && userId !== user.id);
				if (!hasOtherAdmins) {
					await accountsService.deleteAccount(acc.account.id);
				} else {
					await accountsService.deleteAccountUser(acc.account.id, user.id);
				}
			} else {
				await accountsService.deleteAccountUser(acc.account.id, user.id);
			}
		}
		await db
			.update(users)
			.set({
				deleted: true,
				deletedAt: new Date(),
				email: unsetPersonalData ? null : void 0,
				emailVerificationToken: null,
				emergencyPassword: null,
				name: unsetPersonalData ? 'User' : void 0,
				oauthAccessToken: null,
				oauthProfile: null,
				recoveryPassphrase: null,
				recoveryRequestedAt: null,
				recoveryToken: null,
				webauthnAuthenticators: []
			})
			.where(eq(users.id, userId));
		return true;
	}

	async findUser(userId: string) {
		return db.query.users.findFirst({
			columns: this.columns,
			where: eq(users.id, userId),
			with: {
				accountsToUsers: {
					columns: {
						createdAt: true,
						role: true
					},
					with: {
						account: {
							columns: accountsService.columns,
							with: {
								plan: {
									columns: plansService.columns
								}
							}
						}
					}
				}
			}
		});
	}

	async findUserByEmail(email: string) {
		return db.query.users.findFirst({
			columns: this.columns,
			where: eq(users.email, email),
			with: {
				accountsToUsers: {
					columns: {
						createdAt: true,
						role: true
					},
					with: {
						account: {
							columns: accountsService.columns,
							with: {
								plan: {
									columns: plansService.columns
								}
							}
						}
					}
				}
			}
		});
	}

	async findUserForEmergency(email: string) {
		return db.query.users.findFirst({
			columns: {
				...this.columns,
				emergencyPassword: true
			},
			where: eq(users.email, email),
			with: {
				accountsToUsers: {
					columns: {
						createdAt: true,
						role: true
					},
					with: {
						account: {
							columns: accountsService.columns,
							with: {
								plan: {
									columns: plansService.columns
								}
							}
						}
					}
				}
			}
		});
	}

	async findUserForWebauthn(userIdOrEmail: string) {
		return db.query.users.findFirst({
			columns: {
				...this.columns,
				webauthnAuthenticators: true
			},
			where: userIdOrEmail.includes('@')
				? eq(users.email, userIdOrEmail)
				: eq(users.id, userIdOrEmail),
			with: {
				accountsToUsers: {
					columns: {
						createdAt: true,
						role: true
					},
					with: {
						account: {
							columns: accountsService.columns,
							with: {
								plan: {
									columns: plansService.columns
								}
							}
						}
					}
				}
			}
		});
	}

	async findUserForEmailVerification(userId: string) {
		return db.query.users.findFirst({
			columns: {
				email: true,
				emailVerificationToken: true,
				id: true
			},
			where: eq(users.id, userId)
		});
	}

	async findUserForRecovery(userIdOrEmail: string) {
		return db.query.users.findFirst({
			columns: {
				email: true,
				emergency: true,
				id: true,
				locale: true,
				name: true,
				recoveryPassphrase: true,
				recoveryPassphraseHint: true,
				recoveryRequestedAt: true,
				recoveryToken: true
			},
			where: eq(userIdOrEmail.includes('@') ? users.email : users.id, userIdOrEmail)
		});
	}

	async updateUser(
		userId: string,
		data: Partial<
			Pick<
				IUserSchema,
				| 'email'
				| 'name'
				| 'jwtNonce'
				| 'emailVerificationToken'
				| 'emailVerified'
				| 'oauthAccessToken'
				| 'oauthProvider'
				| 'oauthProfile'
				| 'recoveryPassphrase'
				| 'recoveryPassphraseHint'
				| 'recoveryRequestedAt'
				| 'recoveryToken'
				| 'webauthnAuthenticators'
			>
		>
	) {
		await db
			.update(users)
			.set({
				email: data.email,
				emailVerified: data.emailVerified,
				emailVerificationToken: data.emailVerificationToken,
				jwtNonce: data.jwtNonce,
				name: data.name,
				oauthAccessToken: data.oauthAccessToken,
				oauthProvider: data.oauthProvider,
				oauthProfile: data.oauthProfile,
				recoveryPassphrase: data.recoveryPassphrase
					? await argon2.hash(data.recoveryPassphrase)
					: data.recoveryPassphrase,
				recoveryPassphraseHint: data.recoveryPassphraseHint,
				recoveryRequestedAt: data.recoveryRequestedAt,
				recoveryToken: data.recoveryToken,
				webauthnAuthenticators: data.webauthnAuthenticators
			})
			.where(eq(users.id, userId));
	}

	generateJWT(
		user: Pick<IUser, 'id' | 'jwtNonce'>,
		device?: Pick<IDevice, 'id'>,
		expiresIn: string = '4h'
	) {
		return jwt.sign(
			{
				deviceId: device?.id,
				nonce: user.jwtNonce
			},
			env.SIGNING_SECRET,
			{
				expiresIn,
				issuer: env.JWT_ISSUER,
				subject: String(user.id)
			}
		);
	}

	verifyJWT(token: string) {
		const { deviceId, nonce, sub, exp, iat } = jwt.verify(token, env.SIGNING_SECRET, {
			issuer: env.JWT_ISSUER
		}) as jwt.JwtPayload;
		return {
			deviceId,
			expire: exp,
			issued: iat,
			nonce,
			userId: sub
		};
	}

	async verifyRecoveryPassphrase(hashed: string, phrase: string) {
		let ok: boolean = false;
		try {
			ok = await argon2.verify(hashed, phrase);
		} catch {
			// internal error
		}
		return ok;
	}

	async requestEmailVerification(userId: string) {
		const user = await this.findUser(userId);
		if (!user?.email) {
			throw new ForbiddenError();
		}
		const emailVerificationToken = this.generateEmailVerifyToken();
		await this.updateUser(user.id, {
			emailVerificationToken
		});
		await eventsService.trackEvent({
			data: {
				emailVerificationToken
			},
			event: EEvents.USERS_REQUEST_EMAIL_VERIFICATION,
			user
		});
	}

	async requestRecovery(email: string) {
		const user = await this.findUserForRecovery(email);
		if (!user || !user.email) {
			throw new ForbiddenError();
		}
		if (
			user.recoveryRequestedAt &&
			user.recoveryRequestedAt.getTime() > Date.now() - RECOVERY_THROTTLE
		) {
			// throttled
			throw new ForbiddenError();
		}
		const recoveryToken = this.generateRecoveryToken();
		await this.updateUser(user.id, {
			recoveryToken,
			recoveryRequestedAt: new Date()
		});
		await eventsService.trackEvent({
			data: {
				recoveryToken
			},
			event: EEvents.USERS_REQUEST_RECOVERY,
			user
		});
	}
}

export const usersService = new UsersService();
