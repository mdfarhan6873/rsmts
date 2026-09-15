import mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';


export type LocationDocument = mongoose.HydratedDocument<Location>;

export enum LocationCategory {
  COMMON = 'COMMON',
  REPAIRING = 'REPAIRING',
  MANUFACTURING = 'MANUFACTURING',
}

export enum LocationType {
  GROUP = 'GROUP',
  PARKING_LINE = 'PARKING_LINE',
  REPAIR_SHOP = 'REPAIR_SHOP',
  QA = 'QA',
  TRIAL_YARD = 'TRIAL_YARD',
  EXIT_YARD = 'EXIT_YARD',
  MANUFACTURING_SHOP = 'MANUFACTURING_SHOP',
  YARD = 'YARD',
  SPECIALTY_LINE = 'SPECIALTY_LINE',
}

export enum LocationPipeline {
  COMMON = 'COMMON',
  REPAIRING = 'REPAIRING',
  MANUFACTURING = 'MANUFACTURING',
}

export enum LocationRole {
  HOLDING = 'HOLDING',
  ENTRY = 'ENTRY',
  PARKING = 'PARKING',
  REPAIR = 'REPAIR',
  MANUFACTURING = 'MANUFACTURING',
  QA = 'QA',
  TESTING = 'TESTING',
  EXIT = 'EXIT',
  DISPATCH = 'DISPATCH',
}

@Schema({
  collection: 'locations',
  timestamps: true,
})
export class Location {
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
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
    enum: LocationCategory,
    index: true,
  })
  category: LocationCategory;

  @Prop({
    type: String,
    required: true,
    enum: LocationType,
    index: true,
  })
  locationType: LocationType;

  @Prop({
    type: [String],
    enum: LocationPipeline,
    default: [],
    index: true,
  })
  pipelines: LocationPipeline[];

  @Prop({
    type: String,
    required: true,
    enum: LocationRole,
    index: true,
  })
  role: LocationRole;

  /**
   * Null for top-level locations.
   * Example:
   * YARD_NORTH_LINE_01 -> NORTH_YARD
   */
  @Prop({
    type: String,
    default: null,
    uppercase: true,
    trim: true,
    index: true,
  })
  parentCode: string | null;

  @Prop({
    type: Number,
    min: 0,
    default: null,
  })
  maxCapacity?: number | null;

  @Prop({
    type: String,
    trim: true,
    default: null,
  })
  remark?: string | null;

  @Prop({
    type: Boolean,
    default: true,
    index: true,
  })
  isActive: boolean;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

LocationSchema.index({
  category: 1,
  locationType: 1,
  isActive: 1,
});

LocationSchema.index({
  parentCode: 1,
  isActive: 1,
});

LocationSchema.index({
  pipelines: 1,
  isActive: 1,
});

LocationSchema.index({
  role: 1,
  isActive: 1,
});

