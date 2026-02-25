import type { User } from '../entities/user.js';

export interface TokenService {
  generate(payload: TokenPayload): string;
  generateRefreshToken(userId: string): string;
  verify(token: string): TokenPayload;
  decode(token: string): TokenPayload;
}

export interface TokenPayload {
  id: User['id'];
  userType: 'EMPLOYEE' | 'CUSTOMER';
}
