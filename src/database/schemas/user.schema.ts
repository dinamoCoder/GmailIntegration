import { Schema, Document } from 'mongoose';

export interface User extends Document {
  googleId: string;
  accessToken: string;
  refreshToken: string;
}

export const UserSchema = new Schema({
  googleId: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
});
