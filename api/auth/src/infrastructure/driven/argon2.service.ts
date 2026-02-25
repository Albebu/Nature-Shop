import argon2 from 'argon2';
import type { PasswordService } from '../../domain/ports/password.service.js';

export class Argon2Service implements PasswordService {
  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await argon2.verify(hash, password);
  }
}
