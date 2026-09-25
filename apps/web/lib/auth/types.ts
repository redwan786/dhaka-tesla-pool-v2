export type UserRole = 'PASSENGER' | 'DRIVER';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isOnline: boolean;
  createdAt: string;
};

export type AuthResult = {
  user: AuthUser;
  token: string;
};
