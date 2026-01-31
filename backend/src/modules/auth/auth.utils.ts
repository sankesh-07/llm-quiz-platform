import jwt from 'jsonwebtoken';
import { JwtUserPayload, UserRole } from '../common/roles';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '7d';

export const signToken = (userId: string, role: UserRole): string => {
  const payload: JwtUserPayload = { userId, role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtUserPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtUserPayload;
};
