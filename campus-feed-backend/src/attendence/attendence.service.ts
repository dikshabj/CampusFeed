import { BadRequestException, Injectable } from '@nestjs/common';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AttendenceService {
    constructor(
        private prisma : PrismaService,
        private notificationsGateway : NotificationsGateway
    ) {}

    //teacher marks attendence
    async markAttendence(studentId: number, subject: string, status: string){
        const currentHour = new Date().getHours();
        if(currentHour >= 12){
            throw new BadRequestException('Portal locked : Attendence cannot be marked or updated after 12:00Am')

        }
        const record = await this.prisma.attendence.create({
            data : { studentId , subject , status},
        });

        //instant alert
        if(status === 'ABSENT'){
            this.notificationsGateway.server.emit(`attendence_alert_${studentId}`,{
                message : `ALERT: You were marked ABSENT in ${subject}. You have until 12.00 AM to raise dispute!`,
                attendenceId : record.id,
                time : new Date().toISOString()
            });
        }
        return {message : `Attendence marked as ${status}`, record};
    }

    //student raises a dispute
    async raiseDispute(studentId: number, attendenceId : number , reason : string){
        const currentHour = new Date().getHours();
        if(currentHour >= 12){
            throw new BadRequestException('Deadline Passed : Disputes can only be raised before 12:00 PM');
        }
        const record = await this.prisma.attendence.findUnique({
            where : {id : attendenceId}
        });
        if(!record || record.studentId !== studentId){
            throw new BadRequestException('Invalid attendence record.');
        }
        if(record.status !== 'ABSENT'){
            throw new BadRequestException('You cannot dispute this. You are already marked present!');
        }

        //formal dispute ticket
        const dispute = await this.prisma.dispute.create({
            data : {
                attendenceId,
                reason,
            },
        });

        //alert teachers instantly
        this.notificationsGateway.server.emit('teacher_disputes',{
            message : `New Dispute from Student ID ${studentId} for ${record.subject}. Reason: "${reason}"`,
            disputeId : dispute.id
        });

        return {message : "Dispute sent to the teacher successfully.", dispute};
    }
}
