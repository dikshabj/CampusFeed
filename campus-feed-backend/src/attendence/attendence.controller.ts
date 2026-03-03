import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AttendenceService } from './attendence.service';
import { AtGuard } from 'src/common/guards/at.guard';

@Controller('attendence')
export class AttendenceController {
    constructor(private readonly attendenceService: AttendenceService) { }

    // For teachers to mark attendance one by one
    @Post('mark')
    async markAttendence(
        @Body('rollNumber') rollNumber: string,
        @Body('subject') subject: string,
        @Body('status') status: string
    ) {
        return this.attendenceService.markAttendence(rollNumber, subject, status.toUpperCase());
    }

    // For teachers to mark attendance in bulk
    @Post('mark-bulk')
    async markBulkAttendence(
        @Body('subject') subject: string,
        @Body('records') records: { rollNumber: string, status: string }[]
    ) {
        return this.attendenceService.markBulkAttendence(subject, records);
    }

    // Student sees their own attendance (subject-wise)
    @UseGuards(AtGuard)
    @Get('my-attendance')
    async getMyAttendance(@Req() req: Request) {
        const user = (req as any).user;
        return this.attendenceService.getMyAttendance(user.sub);
    }

    // For student to raise a dispute
    @UseGuards(AtGuard)
    @Post('dispute')
    async raiseDispute(
        @Req() req: Request,
        @Body('attendenceId') attendenceId: number,
        @Body('reason') reason: string
    ) {
        const user = (req as any).user;
        return this.attendenceService.raiseDispute(user.sub, Number(attendenceId), reason);
    }
}
