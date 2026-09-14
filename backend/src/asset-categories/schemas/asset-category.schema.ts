import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AssetCategoryDocument = HydratedDocument<AssetCategory>;

export enum AssetCategoryLevel {
  GRANDPARENT = 'GRANDPARENT',
  PARENT = 'PARENT',
  CHILD = 'CHILD',
}

export enum IdentificationType {
  NUMERIC = 'NUMERIC',
  ALPHANUMERIC = 'ALPHANUMERIC',
}

@Schema({ _id: false })
export class IdentificationRule {
  @Prop({ type: String, enum: IdentificationType, required: true })
  type: IdentificationType;

  @Prop({ type: Number, required: true })
  length: number;

  @Prop({ type: Boolean, default: false })
  checkDigit: boolean;
}

export const IdentificationRuleSchema = SchemaFactory.createForClass(IdentificationRule);

@Schema({
  collection: 'asset_categories',
  timestamps: true,
})
export class AssetCategory {
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  })
  code: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    enum: AssetCategoryLevel,
  })
  level: AssetCategoryLevel;

  @Prop({
    type: String,
    default: null,
  })
  parentCode: string | null;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: IdentificationRuleSchema,
    required: false,
  })
  identificationRule?: IdentificationRule;
}

export const AssetCategorySchema = SchemaFactory.createForClass(AssetCategory);

// Indexes
AssetCategorySchema.index({ parentCode: 1 });
AssetCategorySchema.index({ level: 1 });
