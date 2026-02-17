import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    //automatically kuch chije call krni h jse ki prisma se related
    constructor(
        private prisma : PrismaService,
        private jwtService : JwtService,
        private config: ConfigService,
    ){}

    //signup
    async signup(dto : RegisterDto){
        console.log(dto);
        //check if user exists
        const exists = await this.prisma.user.findUnique({
            where: {email: dto.email},
        });
        if(exists) throw new ConflictException('User already exists');

        //hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        //create user
        const newUser = await this.prisma.user.create({
            data: {
                email : dto.email,
                password : hashedPassword,
                name : dto.name,
                role : dto.role || 'STUDENT',
                branch : dto.branch,
                semester : dto.semester ? Number(dto.semester) : null,

            },
        });

        //generate tokens immediately
        const tokens = await this.getTokens(newUser.id, newUser.role);
        await this.updateRefreshTokenHash(newUser.id , tokens.refresh_token);

        return { user : newUser, ...tokens};

    }

    //login
    async login(dto: LoginDto){
        const user = await this.prisma.user.findUnique({
            where: {email: dto.email},
        });
        if(!user) throw new UnauthorizedException('Invalid Credentials');

        const passwordMatches = await bcrypt.compare(dto.password, user.password);
        if(!passwordMatches) throw new UnauthorizedException('Invalid Credentials');

        //generating tokens
        const tokens = await this.getTokens(user.id, user.role);
        //refresh token ka hash db me save kro
        await this.updateRefreshTokenHash(user.id , tokens.refresh_token);

        return{
            user: {
                id: user.id, email: user.email, name: user.name,
                role: user.role
            },
            ...tokens
        };
    }

    //logout
    async logout(userId: number){
        //db se refresh token htana hai
        await this.prisma.user.updateMany({
            where: {id: userId, hashedRefreshToken : {not : null}},
            data: {hashedRefreshToken: null},

        });
        return {message: 'Logged out successfully!'}
    }

    //refresh token
    async refreshTokens(userId: number, rt: string){
        const user = await this.prisma.user.findUnique({
            where: {id : userId},
        });
        if(!user || !user.hashedRefreshToken) throw new ForbiddenException('Access Denied');

        //compare rt with hash in db
        const rtMatches = await bcrypt.compare(rt, user.hashedRefreshToken);
        if(!rtMatches) throw new ForbiddenException('Access Denied');

        //generate new tokens
        const tokens = await this.getTokens(user.id , user.role);
        await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

        return tokens;
    }



//save hash to db
async updateRefreshTokenHash(userId: number, rt: string){
    const hash = await bcrypt.hash(rt, 10);
    await this.prisma.user.update({
        where : { id : userId},
        data : {hashedRefreshToken: hash},
    });
  
}

//generate tokens 
async getTokens(userId: number, role: string){
    const payload = {sub : userId, role};

    //dono tokens parallel me create karo
    const [at, rt] = await Promise.all([
        //access token (15min expiry)
        this.jwtService.signAsync(payload, {
            secret: this.config.get<string>('JWT_ACCESS_SECRET'),
            expiresIn : '15m',
        }),
        this.jwtService.signAsync(payload, {
            secret: this.config.get<string>('JWT_REFRESH_SECRET'),
            expiresIn : '7d',
        })
    ]);

    return {
        access_token: at,
        refresh_token: rt,
    };
    

}
}
    
