import { Controller, Get, Query, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profile.service';
import { FilterProfilesDto } from './dto/filter-profile.dto';
import { parseNaturalQuery } from './utils/query-parser';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)   // ← THIS protects ALL routes in this controller
@Controller({ version: '1', path: 'profiles' })
export class V1ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  async findAll(@Query() filters: FilterProfilesDto) {
    if (
      filters.min_age !== undefined &&
      filters.max_age !== undefined &&
      filters.min_age > filters.max_age
    ) {
      throw new HttpException(
        { status: 'error', message: 'Invalid query parameters' },
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.profilesService.findAll(filters);
  }

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    if (!query || !query.trim()) {
      throw new HttpException(
        { status: 'error', message: 'Invalid query parameters' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const parsed = parseNaturalQuery(query);

    if (!parsed) {
      throw new HttpException(
        { status: 'error', message: 'Unable to interpret query' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const filters: FilterProfilesDto = {
      ...parsed,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };

    return this.profilesService.findAll(filters);
  }
}
