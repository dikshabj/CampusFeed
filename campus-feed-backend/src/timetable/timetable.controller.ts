import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { AtGuard } from 'src/common/guards/at.guard';
import type { Request } from 'express';

@Controller('timetable')
export class TimetableController {
    constructor(private readonly timetableService: TimetableService) { }

    @UseGuards(AtGuard)
    @Post()
    async createEntry(@Body() dto: any, @Req() req: Request) {
        const user = (req as any).user;
        if (user.role !== 'ADMIN' && user.role !== 'FACULTY') {
            throw new Error('Unauthorized');
        }
        return this.timetableService.createEntry(dto);
    }

    @UseGuards(AtGuard)
    @Get()
    async getTimetable(
        @Query('branch') branch: string,
        @Query('semester') semester: string,
        @Query('section') section?: string,
    ) {
        return this.timetableService.getTimetable(branch, Number(semester), section);
    }

    @UseGuards(AtGuard)
    @Delete(':id')
    async deleteEntry(@Param('id') id: string, @Req() req: Request) {
        const user = (req as any).user;
        if (user.role !== 'ADMIN') throw new Error('Unauthorized');
        return this.timetableService.deleteEntry(Number(id));
    }
}
