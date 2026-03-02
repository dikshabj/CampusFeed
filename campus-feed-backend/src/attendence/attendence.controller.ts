import { Body, Controller, Post } from '@nestjs/common';
import { AttendenceService } from './attendence.service';

@Controller('attendence')
export class AttendenceController {
    constructor(private readonly attendenceService: AttendenceService){}

    //for teachers to mark attendence
    @Post('mark')
    async markAttendence(
        @Body('studentId') studentId : number,
        @Body('subject') subject: string,
        @Body('status') status : string
    ){
        return this.attendenceService.markAttendence(Number(studentId), subject , status.toUpperCase());
    }

    //for student to raise a dispute
    @Post('dispute')
    async raiseDispute(
        @Body('studentId') studentId : number,
        @Body('attendenceId') attendenceId : number,
        @Body('reason') reason: string
    ){
        return this.attendenceService.raiseDispute(Number(studentId), Number(attendenceId), reason)
    }
}
