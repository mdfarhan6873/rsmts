import mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';


export enum PipelineOperation {
  REPAIRING = 'REPAIRING',
  MANUFACTURING = 'MANUFACTURING',
}

@Schema({
  collection: 'routing_rules',
  timestamps: true,
})
export class RoutingRule {
  @Prop({
    type: String,
    required: true,
    index: true,
    uppercase: true,
    trim: true,
  })
  assetCategoryCode: string;

  @Prop({
    type: String,
    required: true,
    enum: PipelineOperation,
  })
  pipeline: PipelineOperation;

  @Prop({
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  })
  locationCode: string;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  remark: string;
}

export type RoutingRuleDocument = RoutingRule & mongoose.Document;

export const RoutingRuleSchema = SchemaFactory.createForClass(RoutingRule);

// Ensure no duplicate strict mapping
RoutingRuleSchema.index(
  { assetCategoryCode: 1, pipeline: 1, locationCode: 1 },
  { unique: true }
);

