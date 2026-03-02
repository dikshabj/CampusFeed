import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({message : 'Please enter a valid email, rollno , or teacher id'})
  @IsNotEmpty({message : 'Identifer cannot be empty'})
  loginIdentifier : string;


  /* @IsEmail({}, { message: 'Please enter a valid email address' }) // ✨ Email check karega
  @IsNotEmpty()
  email: string; */

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' }) // ✨ Security ke liye
  password: string;
}

export class ForgotPasswordDto{
  @IsEmail({}, {message: 'Please enter valid email address'})
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto{
  @IsEmail()
  @IsNotEmpty()
  email:string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, {message: 'Password must be atleast 6 character long'})
  newPassword: string;
}