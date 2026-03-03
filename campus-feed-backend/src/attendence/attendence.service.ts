import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AttendenceService {
    constructor(
        private prisma: PrismaService,
        private notificationsGateway: NotificationsGateway
    ) { }

    // teacher marks attendence
    async markAttendence(rollNumber: string, subject: string, status: string) {
        const currentHour = new Date().getHours();
        if (currentHour < 9) { // Unlock portal after 9 AM as per latest user request
            throw new BadRequestException('Portal locked: Attendance can only be marked after 9:00 AM');
        }

        const student = await this.prisma.user.findUnique({
            where: { rollNumber: rollNumber }
        });

        if (!student || student.role !== 'STUDENT') {
            throw new BadRequestException(`Student with Roll Number ${rollNumber} not found.`);
        }

        const record = await this.prisma.attendence.create({
            data: { studentId: student.id, subject, status },
        });

        // instant alert
        if (status === 'ABSENT') {
            this.notificationsGateway.server.emit(`attendence_alert_${student.id}`, {
                message: `ALERT: You were marked ABSENT in ${subject}. You have until 12:00 AM to raise dispute!`,
                attendenceId: record.id,
                time: new Date().toISOString()
            });
        }
        return { message: `Attendence marked as ${status}`, record };
    }

    // teacher marks attendance in bulk
    async markBulkAttendence(subject: string, records: { rollNumber: string, status: string }[]) {
        const results = await Promise.all(
            records.map(async (r) => {
                try {
                    return await this.markAttendence(r.rollNumber, subject, r.status.toUpperCase());
                } catch (err) {
                    return { rollNumber: r.rollNumber, error: err.message };
                }
            })
        );
        return { message: 'Bulk attendance processing complete', results };
    }

    // student raises a dispute
    async raiseDispute(studentId: number, attendenceId: number, reason: string) {
        const currentHour = new Date().getHours();
        if (currentHour < 9) {
            throw new BadRequestException('Disputes can only be raised after 9:00 AM');
        }

        const record = await this.prisma.attendence.findUnique({
            where: { id: attendenceId },
            include: { student: true }
        });

        if (!record || record.studentId !== studentId) {
            throw new BadRequestException('Invalid attendence record.');
        }

        if (record.status !== 'ABSENT') {
            throw new BadRequestException('You cannot dispute this. You are already marked present!');
        }

        // formal dispute ticket
        const dispute = await this.prisma.dispute.create({
            data: {
                attendenceId,
                reason,
            },
        });

        // alert teachers instantly
        this.notificationsGateway.server.emit('teacher_disputes', {
            message: `New Dispute from RollNo ${record.student.rollNumber} for ${record.subject}. Reason: "${reason}"`,
            disputeId: dispute.id
        });

        return { message: "Dispute sent to the teacher successfully.", dispute };
    }

    // Student views their own attendance (subject-wise)
    async getMyAttendance(studentId: number) {
        const records = await this.prisma.attendence.findMany({
            where: { studentId },
            orderBy: { createdAt: 'desc' },
            include: { dispute: true },
        });

        // Group by subject
        const subjectMap: Record<string, { total: number; present: number; absent: number; records: any[] }> = {};

        records.forEach(r => {
            if (!subjectMap[r.subject]) {
                subjectMap[r.subject] = { total: 0, present: 0, absent: 0, records: [] };
            }
            subjectMap[r.subject].total++;
            if (r.status === 'PRESENT') subjectMap[r.subject].present++;
            if (r.status === 'ABSENT') subjectMap[r.subject].absent++;
            subjectMap[r.subject].records.push(r);
        });

        return {
            message: 'Attendance fetched successfully',
            totalRecords: records.length,
            subjects: subjectMap,
        };
    }
}
