import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from "class-validator";

export class LoginDto{
    @IsEmail({}, {message: 'Invalid email format'})
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6, {message: 'Password must be at least 6 characters'})
    password: string
}

export class SignupDto{
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    branch?: string;

    @IsOptional()
    @IsNumber()
    semester?: number;


}