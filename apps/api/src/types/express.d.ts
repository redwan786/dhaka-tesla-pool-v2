import type { AuthenticatedUser } from '../lib/auth.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
