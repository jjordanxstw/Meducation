/**
 * News Module
 * Public "Hot News" listing + detail and admin CRUD with cover upload, plus
 * admin-managed news categories (name + color).
 */

import { Module } from '@nestjs/common';
import { NewsPublicController } from './controllers/news.controller';
import { NewsAdminController } from './controllers/news.admin.controller';
import { NewsCategoriesAdminController } from './controllers/news-categories.admin.controller';
import { NewsService } from './services/news.service';
import { NewsCategoriesService } from './services/news-categories.service';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, AdminAuthModule, AuditModule],
  controllers: [NewsPublicController, NewsAdminController, NewsCategoriesAdminController],
  providers: [NewsService, NewsCategoriesService],
  exports: [NewsService, NewsCategoriesService],
})
export class NewsModule {}
