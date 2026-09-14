import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

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
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({
    required: true,
    select: false,
  })
  password: string;

  @Prop({
    required: true,
    enum: UserRole,
    index: true,
  })
  role: UserRole;

  @Prop({
    trim: true,
    default: null,
  })
  remark?: string;

  @Prop({
    default: true,
    index: true,
  })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
