import mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';


export type RefreshSessionDocument = RefreshSession & mongoose.Document;

@Schema({ timestamps: true })
export class RefreshSession {
  @Prop({ type: mongoose.Types.ObjectId, required: true, ref: 'User' })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  tokenHash: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Date })
  revokedAt?: Date;
}

export const RefreshSessionSchema = SchemaFactory.createForClass(RefreshSession);

