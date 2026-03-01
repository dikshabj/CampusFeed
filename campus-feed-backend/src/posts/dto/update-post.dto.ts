import { PostType } from "@prisma/client";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdatePostDto{
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    type?: PostType;

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