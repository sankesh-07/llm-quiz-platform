import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from '../common/roles';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole; // 'student' or 'admin'
  boardCode?: string;
  standard?: number;
  parentId?: string; // links to Parent.parentId
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin', 'parent'], required: true },
    boardCode: { type: String },
    standard: { type: Number },
    parentId: { type: String },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', UserSchema);
