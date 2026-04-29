import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Parser } from 'json2csv';
import { ProfilesService } from '../profiles/profile.service';
import { FilterProfilesDto } from '../profiles/dto/filter-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller({ version: '1', path: 'export' })
export class ExportController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('csv')
  async exportCsv(@Query() filters: FilterProfilesDto, @Res() res: Response) {
    // Reuse the SAME filter logic — just remove pagination limit
    const result = await this.profilesService.findAll({
      ...filters,
      page: 1,
      limit: 10000,
    });

    // Convert JSON array to CSV string
    const fields = ['id', 'name', 'gender', 'gender_probability', 'age', 'age_group', 'country_id', 'country_name', 'country_probability', 'created_at'];
    const parser = new Parser({ fields });
    const csv = parser.parse(result.data);

    // Send as downloadable file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=profiles.csv');
    res.send(csv);
  }
}
