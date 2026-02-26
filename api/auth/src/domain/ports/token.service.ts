import type { TokenPayload } from '@ecommerce/shared';

export type { TokenPayload };

export interface TokenService {
  generate(payload: TokenPayload): string;
  generateRefreshToken(userId: string): string;
  verify(token: string): TokenPayload;
  decode(token: string): TokenPayload;
}
