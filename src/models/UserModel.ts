import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  pwdHash: string; // Renamed from password
  role: 'Admin' | 'User';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  pwdHash: { type: String, required: true }, // Renamed from password
  role: { type: String, enum: ['Admin', 'User'], default: 'User' }
}, {
  timestamps: true,
  collection: '7b83_users' // Apply prefix here
});

export const UserModel = model<IUser>('User', UserSchema);

// Updated on 2026-01-15 10:36:19
