import { compare, hash } from 'bcrypt';

import type { PasswordService } from '../../domain/ports/password.service.js';
import { ENV } from '../../env.js';

export class BcryptService implements PasswordService {
  async hashPassword(password: string): Promise<string> {
    return await hash(password, ENV.SALT);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await compare(password, hash);
  }
}
