import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IParent extends Document {
  parentId: string; // unique ID used for login and linking
  name: string;
  email?: string;
  passwordHash: string;
  children: Types.ObjectId[]; // references User documents
}

const ParentSchema = new Schema<IParent>(
  {
    parentId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, lowercase: true },
    passwordHash: { type: String, required: true },
    children: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const ParentModel = mongoose.model<IParent>('Parent', ParentSchema);
