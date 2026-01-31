export type UserRole = 'student' | 'admin' | 'parent';

export interface JwtUserPayload {
  userId: string;
  role: UserRole;
}
