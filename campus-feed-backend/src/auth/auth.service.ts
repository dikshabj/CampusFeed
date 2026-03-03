import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto, LoginDto, ResetPasswordDto } from './dto/login.dto';
import { EmailService } from 'src/common/services/email/email.service';

@Injectable()
export class AuthService {
    //automatically kuch chije call krni h jse ki prisma se related
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService,
        private emailService: EmailService,
    ) { }

    //signup
    async signup(dto: RegisterDto) {
        //roll number check
        if (dto.role === 'STUDENT' && !dto.rollNumber) {
            throw new BadRequestException("Students must provide a valid Roll Number to register.");
        }
        if (dto.role === 'FACULTY' && !dto.teacherId) {
            throw new BadRequestException("Faculty members must provide a Teacher ID to register.");
        }
        if (dto.role === 'ADMIN') {
            throw new ForbiddenException("Public registration for ADMIN role is not allowed.");
        }
        //console.log(dto);
        //check if user exists
        const exists = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: dto.email },
                    { rollNumber: dto.rollNumber || undefined },
                    { teacherId: dto.teacherId || undefined }
                ]
            }
        });
        if (exists) throw new ConflictException('User already exists');

        //hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        //create user
        const newUser = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                name: dto.name,
                role: dto.role || 'STUDENT',
                branch: dto.branch,
                semester: dto.semester ? Number(dto.semester) : null,
                batch: dto.batch,
                section: dto.section,
                // Only save specific IDs based on their role
                rollNumber: dto.role === 'STUDENT' ? dto.rollNumber : null,
                teacherId: dto.role === 'FACULTY' ? dto.teacherId : null,

            },
        });




        //generate tokens immediately
        const tokens = await this.getTokens(newUser.id, newUser.role);
        await this.updateRefreshTokenHash(newUser.id, tokens.refresh_token);

        return { user: newUser, ...tokens };

    }

    //login
    async login(dto: LoginDto) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: dto.loginIdentifier },
                    { rollNumber: dto.loginIdentifier },
                    { teacherId: dto.loginIdentifier }
                ]

            },
        });
        if (!user) throw new UnauthorizedException('Invalid Credentials');

        const passwordMatches = await bcrypt.compare(dto.password, user.password);
        if (!passwordMatches) throw new UnauthorizedException('Invalid Credentials');

        //generating tokens
        const tokens = await this.getTokens(user.id, user.role);
        //refresh token ka hash db me save kro
        await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

        return {
            user: {
                id: user.id, email: user.email, name: user.name,
                role: user.role
            },
            ...tokens
        };
    }

    //logout
    async logout(userId: number) {
        //db se refresh token htana hai
        await this.prisma.user.updateMany({
            where: { id: userId, hashedRefreshToken: { not: null } },
            data: { hashedRefreshToken: null },

        });
        return { message: 'Logged out successfully!' }
    }

    //refresh token
    async refreshTokens(userId: number, rt: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.hashedRefreshToken) throw new ForbiddenException('Access Denied');

        //compare rt with hash in db
        const rtMatches = await bcrypt.compare(rt, user.hashedRefreshToken);
        if (!rtMatches) throw new ForbiddenException('Access Denied');

        //generate new tokens
        const tokens = await this.getTokens(user.id, user.role);
        await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

        return tokens;
    }



    //save hash to db
    async updateRefreshTokenHash(userId: number, rt: string) {
        const hash = await bcrypt.hash(rt, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { hashedRefreshToken: hash },
        });

    }

    //generate tokens 
    async getTokens(userId: number, role: string) {
        const payload = { sub: userId, role };

        //dono tokens parallel me create karo
        const [at, rt] = await Promise.all([
            //access token (15min expiry)
            this.jwtService.signAsync(payload, {
                secret: this.config.get<string>('JWT_ACCESS_SECRET'),
                expiresIn: '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: this.config.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: '7d',
            })
        ]);

        return {
            access_token: at,
            refresh_token: rt,
        };


    }


    //forget password
    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });
        if (!user) {
            throw new BadRequestException('User with this email does not exist');
        }
        //generates otp
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        //set expiration time
        const otpExpiresAt = new Date();
        otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10);

        //save otp to db
        await this.prisma.user.update({
            where: { email: user.email },
            data: { otp, otpExpiresAt },
        });

        //send the email
        await this.emailService.sendOtpEmail(user.email, otp);

        return { message: 'OTP sent successfully to your email' }
    }

    //reset password
    async resetPassword(dto: ResetPasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            }
        });

        if (!user) {
            throw new BadRequestException('Invalid Request');

        }

        //check if otp matches
        if (user.otp != dto.otp) {
            throw new BadRequestException('Invalid otp');

        }

        //check if otp is expired
        if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
            throw new BadRequestException('Otp has expired!');
        }

        //hash the new password for security
        const hashPassword = await bcrypt.hash(dto.newPassword, 10);

        //update password and clear otp fields
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashPassword,
                otp: null,
                otpExpiresAt: null,
            },
        });

        return { message: 'Password has been reset successfully' }
    }


    //email verification



    //google login

}

