import { BadRequestException, Body, Controller, Get, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { GradesService } from './grades.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { AtGuard } from 'src/common/guards/at.guard';
import type { Request } from 'express';
@Controller('grades')
export class GradesController {
    constructor(private readonly gradesService : GradesService){}

    @UseGuards(AtGuard)
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadGrades(
        @UploadedFile() file:Express.Multer.File,
        @Body('subject') subject: string,
        @Body('maxMarks') maxMarks: string,
        @Body('term') term: string,

    ){
        if(!file){
            throw new BadRequestException('Please upload a csv file.')

        }

        const parsedMaxMarks = parseFloat(maxMarks);

        return this.gradesService.uploadGradesCsv(file , subject , parsedMaxMarks , term);
    }

    @UseGuards(AtGuard)
    @Get('my-marks')
    async getMyMarks(@Req() req:Request){
        const user = req.user as any;

        return this.gradesService.getMyGrades(user.sub);

    }

}
