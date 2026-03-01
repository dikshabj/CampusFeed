import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { PostsService } from './posts.service';
import { AtGuard } from 'src/common/guards/at.guard';
import { createPostDto } from 'src/posts/dto/create-post.dto';
import type  {Request } from 'express';
import { UpdatePostDto } from './dto/update-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('posts')
export class PostsController {
    constructor(private readonly postService : PostsService){}
    //first line of defense , you must be logged in
    @UseGuards(AtGuard)
    @Post()
    @UseInterceptors(FileInterceptor('file'))
    createPost(@Req() req: Request, @Body() dto: createPostDto, @UploadedFile() file?: Express.Multer.File){
        //we extract the user details that our jwtstrategy decoded from the token
        console.log('did nestjs catch the file?', file);
        const user = req.user as any;
        if(user.role !== 'FACULTY'){
            throw new ForbiddenException('Access Denied: Only faculty')
        }

        return this.postService.createPost(user.sub, dto, file);


    }

    @UseGuards(AtGuard)
    @Get()
    getFeed(@Req() req: Request){
        const user = req.user as any;

        return this.postService.getFeed(user.sub, user.role);
    }

    //update route
    @UseGuards(AtGuard)
    @Patch(':id')
    updatePost(
        @Param('id') id: string,
        @Req() req: Request,
        @Body() dto: UpdatePostDto
    ){
        const user = req.user as any;

        //check if its a teacher
        if(user.role !== 'FACULTY'){
            throw new ForbiddenException('Access denied: Only faculty can edit posts');

        }
        return this.postService.updatePost(Number(id), user.sub, dto);
    }


    //delete route
    @UseGuards(AtGuard)
    @Delete(':id')
    deletePost(
        @Param('id') id:string,
        @Req() req: Request
    ){
        const user = req.user as any;

        //check if its teacher
        if(user.role !== 'FACULTY'){
            throw new ForbiddenException('Access denied: only faculty can delete posts.');

        }

        return this.postService.deletePost(Number(id), user.sub);
    }

    //comment route
    @UseGuards(AtGuard)
    @Post(':id/comments')
    addComment(
        @Param('id') id: string,
        @Req() req : Request,
        @Body() dto : CreateCommentDto
    ){
        const user = req.user as any;
        //pass the post id , the user id and comment text
        return this.postService.addComment(Number(id), user.sub, dto);
    }


}
