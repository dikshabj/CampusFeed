import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  IsOptional, 
  IsEnum, 
  IsNumber,
  IsInt 
} from 'class-validator';
import { Role } from '@prisma/client'; // Prisma se Role import kiya

export class RegisterDto {
  // 1. Email Check
  @IsEmail({}, { message: 'Please enter a valid email' })
  @IsNotEmpty()
  email: string;

  // 2. Password Check (Min 6 chars)
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  // 3. Name Check
  @IsString()
  @IsNotEmpty()
  name: string;

  // 4. Role (Optional - Default STUDENT hoga logic me)
  @IsOptional()
  @IsEnum(Role, { message: 'Role must be STUDENT, FACULTY, or ADMIN' })
  role?: Role;

  // 5. Branch (Example: CSE, MECH)
  @IsOptional()
  @IsString()
  branch?: string;

  // 6. Semester (Number hona chahiye)
  @IsOptional()
  @IsNumber() 
  // Agar Postman se string aa raha hai ("3") to usko number banane ke liye:
  // @Type(() => Number)  <-- Ye 'class-transformer' se import karna padega agar chahiye
  semester?: number;

  // 7. Roll Number (Note: Ye Database me hona chahiye)
  @IsOptional()
  @IsString()
  rollNumber?: string; 
}