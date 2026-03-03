import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';

interface GradeCsvRow {
    studentId: number;
    subject: string;
    marks: number;
    maxMarks: number;
    term: string;
}

@Injectable()
export class GradesService {
    constructor(private prisma: PrismaService,
        private notificationsGateway: NotificationsGateway
    ) { }


    async uploadGradesCsv(
        file: Express.Multer.File,
        subject: string,
        maxMarks: number,
        term: string,
    ) {
        const validGrades: GradeCsvRow[] = [];
        //explicit type dena pda string ka cuz error arha tha
        const errors: string[] = [];
        let rowNumber = 1;

        const allStudents = await this.prisma.user.findMany({
            where: { role: 'STUDENT', rollNumber: { not: null } },
            select: { id: true, rollNumber: true }
        })

        const rollNumberToIdMap = new Map<string, number>();
        allStudents.forEach((student) => {
            if (student.rollNumber) {
                rollNumberToIdMap.set(student.rollNumber, student.id);
            }
        });

        const stream = Readable.from(file.buffer);

        return new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (row) => {
                    rowNumber++;

                    //smart validation error
                    const rawRollNumber = row.rollNumber?.trim();
                    const marks = parseFloat(row.marks);

                    if (!rawRollNumber) {
                        errors.push(`Row ${rowNumber}: Roll no is missing`);
                    }
                    if (isNaN(marks)) {
                        errors.push(`Row ${rowNumber} : Marks must be valid number.`);
                        return;
                    }

                    const mappedStudentId = rollNumberToIdMap.get(rawRollNumber);

                    if (!mappedStudentId) {
                        errors.push(`Row ${rowNumber}: Student with Roll Number ${rawRollNumber} not found in database.`)
                    } else if (marks > maxMarks) {
                        errors.push(`Row ${rowNumber}: Marks (${marks}) cannot exceed MaxMarks (${maxMarks}).`)
                    } else if (marks < 0) {
                        errors.push(`Row ${rowNumber}: Marks cannot be negative.`);
                    } else {
                        validGrades.push({
                            studentId: mappedStudentId,
                            subject: subject,
                            marks: marks,
                            maxMarks: maxMarks,
                            term: term,
                        });
                    }


                })
                .on('end', async () => {
                    try {
                        //the automator
                        if (validGrades.length > 0) {
                            await this.prisma.grade.createMany({
                                data: validGrades,
                                skipDuplicates: true,
                            });

                            validGrades.forEach(grade => {
                                this.notificationsGateway.sendGradeAlert(grade.studentId, grade.subject);
                            })
                        }
                        resolve({
                            message: 'CSV Processing Complete',
                            totalProcessed: rowNumber - 1,
                            successfulUploads: validGrades.length,
                            failedUploads: errors.length,
                            errorDetails: errors,
                        });
                    } catch (dberror) {
                        console.error(dberror);
                        reject(new BadRequestException('Database error., Ensure student IDS actually exist !'));

                    }
                });
        })

    }

    //fetch my grades
    async getMyGrades(rollNumber: string) {
        const grades = await this.prisma.grade.findMany({
            where: {
                student: {
                    rollNumber: rollNumber
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
        });

        if (grades.length === 0) {
            return { message: "No grades found for you yet.", grades: [] };

        }

        return {
            message: "Grades fetched successfully",
            totalRecords: grades.length,
            grades
        };
    }

    // Fetch grades for a specific subject (for faculty)
    async getGradesBySubject(subject: string) {
        const grades = await this.prisma.grade.findMany({
            where: { subject },
            include: {
                student: {
                    select: { name: true, rollNumber: true, branch: true, semester: true }
                }
            },
            orderBy: { student: { rollNumber: 'asc' } }
        });

        return grades;
    }
}
