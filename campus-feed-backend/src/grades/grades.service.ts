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
        private notificationsGateway : NotificationsGateway
    ){}
    

    async uploadGradesCsv(
        file: Express.Multer.File,
        subject : string,
        maxMarks : number,
        term : string
    ){
        const validGrades : GradeCsvRow[] = [];
        //explicit type dena pda string ka cuz error arha tha
        const errors : string[] = [];
        let rowNumber = 1;

        const stream = Readable.from(file.buffer);

        return new Promise((resolve , reject)=>{
            stream
            .pipe(csv())
            .on('data', (row)=>{
                rowNumber++;

                //smart validation error
                const studentId = parseInt(row.studentId);
                const marks = parseFloat(row.marks);

                if(isNaN(studentId) || isNaN(marks)){
                    errors.push(`Row ${rowNumber}: Invalid data format. ID and Marks must be numbers.`);
                }else if(marks > maxMarks){
                    errors.push(`Row ${rowNumber} : Marks (${marks}) cannot exceed MaxMarks (${maxMarks}).`)
                }else if(marks < 0){
                    errors.push(`Row ${rowNumber} : Marks cannot be negative.`);

                }else{
                    validGrades.push({
                        studentId,
                        subject,
                        marks,
                        maxMarks,
                        term,

                    });
                }
            })
            .on('end', async()=>{
                try {
                    //the automator
                    if(validGrades.length > 0){
                        await this.prisma.grade.createMany({
                            data : validGrades,
                            skipDuplicates : true,
                        });

                        validGrades.forEach(grade =>{
                            this.notificationsGateway.sendGradeAlert(grade.studentId, grade.subject);
                        })
                    }
                    resolve({
                        message : 'CSV Processing Complete',
                        totalProcessed : rowNumber - 1,
                        successfulUploads : validGrades.length,
                        failedUploads : errors.length,
                        errorDetails : errors,
                    });
                } catch (dberror) {
                    console.error(dberror);
                    reject(new BadRequestException('Database error., Ensure student IDS actually exist !'));
                    
                }
            });
        })

    }

    //fetch my grades
    async getMyGrades(studentId: number){
        const grades = await this.prisma.grade.findMany({
            where : {
                studentId : studentId
            },
            orderBy: {
                createdAt : 'desc'
            },
        });

        if(grades.length === 0){
            return {message : "No grades found for you yet." , grades : []};

        }

        return {
            message : "Grades fetched successfully",
            totalRecords : grades.length,
            grades
        };
    }
}
