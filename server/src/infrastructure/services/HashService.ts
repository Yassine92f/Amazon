import bcrypt from 'bcryptjs';
import { IHashService } from '../../domain/services/IHashService';

const SALT_ROUNDS = 12;

export class HashService implements IHashService {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
