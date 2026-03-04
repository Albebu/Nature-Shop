import type { VerificationToken } from '../entities/verification-token.js';

export interface VerificationTokenRepository {
  save(token: VerificationToken): Promise<void>;
  findByToken(token: string): Promise<VerificationToken | null>;
}
