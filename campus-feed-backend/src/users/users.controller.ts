import { Controller, Get, Patch, Param, Body, Query, UseGuards, ForbiddenException, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { AtGuard } from 'src/common/guards/at.guard';
import type { Request } from 'express';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // GET /users/students?branch=CSE&section=A&semester=3
    @UseGuards(AtGuard)
    @Get('students')
    getStudents(
        @Query('branch') branch?: string,
        @Query('section') section?: string,
        @Query('semester') semester?: string,
    ) {
        return this.usersService.getStudents(branch, section, semester ? Number(semester) : undefined);
    }

    // GET /users/teachers
    @UseGuards(AtGuard)
    @Get('teachers')
    getTeachers() {
        return this.usersService.getTeachers();
    }

    // GET /users/all (Admin only)
    @UseGuards(AtGuard)
    @Get('all')
    getAllUsers(@Req() req: Request) {
        const user = req.user as any;
        if (user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
        return this.usersService.getAllUsers();
    }

    // PATCH /users/:id/assign-mentor (Admin only)
    @UseGuards(AtGuard)
    @Patch(':id/assign-mentor')
    assignMentor(
        @Param('id') id: string,
        @Body('mentorId') mentorId: number,
        @Req() req: Request,
    ) {
        const user = req.user as any;
        if (user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
        return this.usersService.assignMentor(Number(id), Number(mentorId));
    }

    // GET /users/my-profile
    @UseGuards(AtGuard)
    @Get('my-profile')
    getMyProfile(@Req() req: Request) {
        const user = req.user as any;
        return this.usersService.getUserById(user.sub);
    }

    // GET /users/:id/mentees
    @UseGuards(AtGuard)
    @Get(':id/mentees')
    getMentees(@Param('id') id: string) {
        return this.usersService.getMentees(Number(id));
    }
}
