import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCommentDto{
    @IsString()
    @IsNotEmpty({message : "Please enter something!"})
    //kyuki bina comment likhe submit kiya toh hm ni chahege kuch send ho
    content : string


}