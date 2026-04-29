import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { ProfilesController } from './profile.controller';
import { V1ProfilesController } from './v1-profile.controller';
import { ProfilesService } from './profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([Profile])],
  controllers: [ProfilesController, V1ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
