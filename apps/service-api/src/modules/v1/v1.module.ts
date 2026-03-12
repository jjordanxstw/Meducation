import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SubjectsModule } from './subjects/subjects.module';
import { SectionsModule } from './sections/sections.module';
import { LecturesModule } from './lectures/lectures.module';
import { ResourcesModule } from './resources/resources.module';
import { CalendarModule } from './calendar/calendar.module';
import { ProfilesModule } from './profiles/profiles.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    AuthModule,
    SubjectsModule,
    SectionsModule,
    LecturesModule,
    ResourcesModule,
    CalendarModule,
    ProfilesModule,
    AuditModule,
  ],
})
export class V1Module {}
