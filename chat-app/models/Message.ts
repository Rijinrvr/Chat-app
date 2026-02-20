import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  sender: string;
  content: string;
  room: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: { type: String, required: true },
    content: { type: String, required: true },
    room: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);
