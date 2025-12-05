import { hash, compare } from 'bcryptjs';

import { AUTH_CONFIG } from '../../constants/config/auth.config';

export const hashPassword = hash;
export const comparePassword = compare;
export const hashWithAuthRounds = (value: string): Promise<string> => hash(value, AUTH_CONFIG.BCRYPT_ROUNDS);
