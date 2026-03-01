import { IsBoolean, IsEmpty, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class createPostDto{
    @IsString()
    @IsNotEmpty()
    title: string;


    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsBoolean()
    @IsOptional()
    isPriority?: boolean;

    @IsString()
    @IsOptional()
    targetBranch?: string;

    @IsNumber()
    @IsOptional()
    targetSemester?: number;

}