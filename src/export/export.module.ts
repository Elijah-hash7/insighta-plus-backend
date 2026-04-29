import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ProfilesModule } from '../profiles/profile.module';

@Module({
  imports: [ProfilesModule],
  controllers: [ExportController],
})
export class ExportModule {}
