import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TimetableService {
    constructor(private prisma: PrismaService) { }

    async createEntry(data: any) {
        return this.prisma.timetable.create({ data });
    }

    async getTimetable(branch: string, semester: number, section?: string) {
        return this.prisma.timetable.findMany({
            where: {
                branch,
                semester,
                section: section || null,
            },
            include: {
                teacher: {
                    select: { name: true, teacherId: true }
                }
            },
            orderBy: [
                { day: 'asc' },
                { startTime: 'asc' }
            ]
        });
    }

    async deleteEntry(id: number) {
        return this.prisma.timetable.delete({ where: { id } });
    }
}
