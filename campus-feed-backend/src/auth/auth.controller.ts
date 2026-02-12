import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/auth.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('signup')
    signup(@Body() dto: SignupDto){
        return this.authService.signup(dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('Login')
    login(@Body() dto: LoginDto){
        return this.authService.login(dto);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    logout(@Body() body: {userId : number}){
        return this.authService.logout(body.userId);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refresh(@Body() body: {userId : number; refresh_token: string}) {
        return this.authService.refreshTokens(body.userId, body.refresh_token);
    }

}
