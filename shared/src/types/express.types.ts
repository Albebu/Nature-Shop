import type { TokenPayload } from './user.types.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// Needed so TS treats this as a module and the global augmentation works
export {};
