import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Asset } from '../../assets/schemas/asset.schema.js';
import { User } from '../../users/schemas/user.schema.js';

export type MovementLogDocument = MovementLog & mongoose.Document;

@Schema({
  collection: 'movement_logs',
  timestamps: false,
})
export class MovementLog {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Asset.name,
    required: true,
    index: true,
  })
  assetId: mongoose.Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true,
  })
  fromLocationCode: string;

  @Prop({
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true,
  })
  toLocationCode: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  movedBy: mongoose.Types.ObjectId;

  @Prop({
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  })
  movedAt: Date;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  remark: string;
}

export const MovementLogSchema = SchemaFactory.createForClass(MovementLog);

