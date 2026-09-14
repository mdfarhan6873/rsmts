import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssetCategoriesService } from './asset-categories.service.js';
import { AssetCategoriesController } from './asset-categories.controller.js';
import { AssetCategory, AssetCategorySchema } from './schemas/asset-category.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AssetCategory.name, schema: AssetCategorySchema },
    ]),
  ],
  controllers: [AssetCategoriesController],
  providers: [AssetCategoriesService],
  exports: [AssetCategoriesService],
})
export class AssetCategoriesModule {}
