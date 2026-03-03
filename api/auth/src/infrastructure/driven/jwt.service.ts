import jwt from 'jsonwebtoken';
import type { TokenPayload, TokenService } from '../../domain/ports/token.service.js';
import { ENV } from '../../env.js';

// Narrows jsonwebtoken result to our TokenPayload shape
function isTokenPayload(value: unknown): value is TokenPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'userId' in value &&
    'userType' in value &&
    typeof value.userId === 'string' &&
    typeof value.userType === 'string'
  );
}

export class JwtService implements TokenService {
  /**
   * Nota: No he conseguido que las funciones donde usamos expiresIn obtengan el valor del ENV, por lo que he hardcodeado los valores aquí. Si alguien sabe cómo hacerlo de forma dinámica 100% tipado, se agradecería la contribución.
   */

  generate(payload: TokenPayload): string {
    return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '15m' });
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, ENV.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  }

  verify(token: string): TokenPayload {
    const result = jwt.verify(token, ENV.JWT_SECRET);
    if (!isTokenPayload(result)) {
      throw new Error('Invalid token payload');
    }
    return result;
  }

  verifyRefreshToken(token: string): TokenPayload {
    const result = jwt.verify(token, ENV.REFRESH_TOKEN_SECRET);
    if (typeof result === 'object' && 'userId' in result && typeof result['userId'] === 'string') {
      return result as TokenPayload;
    }
    throw new Error('Invalid refresh token payload');
  }

  decode(token: string): TokenPayload {
    const result = jwt.decode(token);
    if (!isTokenPayload(result)) {
      throw new Error('Invalid token payload');
    }
    return result;
  }
}
