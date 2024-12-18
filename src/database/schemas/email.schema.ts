import { Schema, Document } from 'mongoose';

export interface Email extends Document {
  subject: string;
  body: string;
  sender: string;
  recipient: string;
}

export const EmailSchema = new Schema({
  subject: { type: String, required: true },
  body: { type: String, required: true },
  sender: { type: String, required: true },
  recipient: { type: String, required: true },
});
