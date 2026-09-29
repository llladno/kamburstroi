import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TeamService } from './team.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

@Controller()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get('team')
  findAll() {
    return this.teamService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/team')
  create(@Body() dto: CreateTeamMemberDto) {
    return this.teamService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/team/reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.teamService.reorder(dto.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/team/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
    return this.teamService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/team/:id')
  remove(@Param('id') id: string) {
    return this.teamService.remove(id);
  }
}
