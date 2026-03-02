import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AttendenceService } from './attendence.service';
import { AtGuard } from 'src/common/guards/at.guard';

@Controller('attendence')
export class AttendenceController {
    constructor(private readonly attendenceService: AttendenceService){}

    //for teachers to mark attendence
    @Post('mark')
    async markAttendence(
        @Body('rollNumber') rollNumber : string,
        @Body('subject') subject: string,
        @Body('status') status : string
    ){
        return this.attendenceService.markAttendence(rollNumber, subject , status.toUpperCase());
    }

    //for student to raise a dispute
    @UseGuards(AtGuard)
    @Post('dispute')
    async raiseDispute(
        @Req() req: Request,
        
        @Body('attendenceId') attendenceId : number,
        @Body('reason') reason: string
    ){
        const user = (req as any).user;
        return this.attendenceService.raiseDispute(user.sub, Number(attendenceId), reason)
    }
}
