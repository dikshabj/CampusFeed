import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    // Get students filtered by branch/section/semester
    async getStudents(branch?: string, section?: string, semester?: number) {
        const where: any = { role: 'STUDENT' };
        if (branch) where.branch = branch;
        if (section) where.section = section;
        if (semester) where.semester = semester;

        return this.prisma.user.findMany({
            where,
            select: {
                id: true, name: true, email: true,
                rollNumber: true, branch: true,
                semester: true, batch: true, section: true,
                mentorId: true,
            },
            orderBy: { rollNumber: 'asc' },
        });
    }

    // Get all teachers
    async getTeachers() {
        return this.prisma.user.findMany({
            where: { role: 'FACULTY' },
            select: {
                id: true, name: true, email: true,
                teacherId: true, branch: true,
            },
            orderBy: { name: 'asc' },
        });
    }

    // Get all users (Admin)
    async getAllUsers() {
        return this.prisma.user.findMany({
            select: {
                id: true, name: true, email: true, role: true,
                rollNumber: true, teacherId: true,
                branch: true, semester: true, batch: true, section: true,
                mentorId: true, createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Assign mentor to a student
    async assignMentor(studentId: number, mentorId: number) {
        const student = await this.prisma.user.findUnique({ where: { id: studentId } });
        if (!student) throw new NotFoundException('Student not found');

        const mentor = await this.prisma.user.findUnique({ where: { id: mentorId } });
        if (!mentor || mentor.role !== 'FACULTY')
            throw new NotFoundException('Mentor not found or is not faculty');

        await this.prisma.user.update({
            where: { id: studentId },
            data: { mentorId },
        });
        return { message: `Mentor ${mentor.name} assigned to ${student.name}` };
    }

    // Get user by ID
    async getUserById(id: number) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true, name: true, email: true, role: true,
                rollNumber: true, teacherId: true,
                branch: true, semester: true, batch: true, section: true,
                mentorId: true, mentor: { select: { name: true, teacherId: true } },
            },
        });
    }

    // Get mentees of a teacher
    async getMentees(mentorId: number) {
        return this.prisma.user.findMany({
            where: { mentorId },
            select: {
                id: true, name: true, email: true,
                rollNumber: true, branch: true,
                semester: true, batch: true, section: true,
            },
            orderBy: { rollNumber: 'asc' },
        });
    }
}
