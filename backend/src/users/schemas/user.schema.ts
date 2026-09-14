import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  YARD_CONTROLLER = 'YARD_CONTROLLER',
  REPAIR_SUPERVISOR = 'REPAIR_SUPERVISOR',
  MANUFACTURING_SUPERVISOR = 'MANUFACTURING_SUPERVISOR',
  QA_INSPECTOR = 'QA_INSPECTOR',
  MANAGEMENT = 'MANAGEMENT',
  VIEWER = 'VIEWER',
}

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  _id: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({
    type: String,
    required: true,
    select: false,
  })
  password: string;

  @Prop({
    type: String,
    required: true,
    enum: UserRole,
    index: true,
  })
  role: UserRole;

  @Prop({
    type: String,
    trim: true,
    default: null,
  })
  remark?: string;

  @Prop({
    type: Boolean,
    default: true,
    index: true,
  })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
