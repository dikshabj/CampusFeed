import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PostType } from '@prisma/client';
import { createPostDto } from 'src/posts/dto/create-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePostDto } from './dto/update-post.dto';
import { AwsService } from 'src/aws/aws.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';

@Injectable()
export class PostsService {
    constructor(private prisma : PrismaService,
        private awsService : AwsService,
        private notificationsGateway : NotificationsGateway
    ){}
    
    async createPost(userId: number, dto:createPostDto, file?: Express.Multer.File){
        try {
            let fileUrl : string | null = null;
            if(file){
                fileUrl = await this.awsService.uploadFile(file, 'posts');
            }
            const newPost = await this.prisma.post.create({
                data:{
                    title : dto.title,
                    description : dto.description,
                    //kyuki type ek enum tha 
                    //dto se always string value ati hai
                    //isiliye typescript ne error dia
                    type : dto.type as PostType || 'NOTICE',
                    isPriority : dto.isPriority || false,

                    //smart targeting features
                    targetBranch: dto.targetBranch,
                    targetSemester: dto.targetSemester,

                    authorId : userId,
                    attachmentUrl : fileUrl,



                }
            });

            this.notificationsGateway.sendNewPostAlert(newPost.title , newPost.type);

            return {
                message : 'Post created successfully',
                post : newPost
            };
        } catch (error) {
            console.error('Error creating post: ', error );
            throw new InternalServerErrorException('Failed to create the post. Please try again later.')
            
        }
    }

    //get smart feed
    async getFeed(userId: number, role: string){
        try {
            //1. fetch users profile
            const user = await this.prisma.user.findUnique({
                where : {id : userId},
                select : { branch: true, semester : true},
                //only fetch what we need
            });


            //comment show
            const feedIncludeQuery = {
                author : {select : {name: true, role: true}},
                //We tell Prisma to fetch the comments too!
                comments: {
                    include: {
                        author: { select: { name: true, role: true } } // So we know WHO commented
                    },
                    orderBy: { createdAt: 'asc' } // Oldest comments at the top, like Instagram
                }
            };

            //if its factuly member lets show them all posts
            if(role === 'FACULTY'){
                return await this.prisma.post.findMany({
                    orderBy: {createdAt : 'desc'}, //newest post first
                    include: {
                        author: {select : {name : true, role : true}},
                        //include the creater's name safely
                    },
                });
            }

            //3. if it is student then smart filter
            const posts = await this.prisma.post.findMany({
                where: {
                    OR:[
                        //logic 1 : global post (no target branch or semester)
                        {targetBranch : null, targetSemester: null},

                        //logic 2: targeted to the student's exact branch (any semester)
                        {targetBranch: user?.branch, targetSemester: null},

                        //logic 3: targeted to the students exact semester(any branch)
                        {targetBranch : null, targetSemester: user?.semester},

                        //logic 4: targeted specifically to their branch and semester
                        {targetBranch: user?.branch, targetSemester: user?.semester}
                    ],
                },
                orderBy : {createdAt : 'desc'}, //newest post first
                include : {
                    //we will not send the whole author object as it
                    //contains the password hash
                    author : {select : {name: true, role: true}},
                },
            });

            return{
                message : 'Feed fetched successfully',
                count : posts.length,
                posts : posts,
            };
        } catch (error) {
            console.error('Error fetching feed:', error);
            throw new InternalServerErrorException('Failed to fetch the feed.')
            
        }
    }

    //update post 
    async updatePost(postId : number, userId : number , dto : UpdatePostDto){
        //find the post first
        const post = await this.prisma.post.findUnique({
            where : {id: postId},
        });

        if(!post){
            throw new NotFoundException('Post not found');
        }

        if(post.authorId !== userId){
            throw new ForbiddenException('Access Denied: You can only edit your own post.');

        }
         const updatedPost = await this.prisma.post.update({
            where : {id : postId},
            data : dto,
            
        });
        return {message : 'Post updated successfully' , post : updatedPost};
    }

    //delete post
    async deletePost(postId: number , userId: number){
        //1.find the post
        const post = await this.prisma.post.findUnique({
            where : {id : postId},
        });

        if(!post){
            throw new NotFoundException('Post not found');
        }

        if(post.authorId !== userId){
            throw new ForbiddenException('Access denied: you can only delete your own post')
        }

        await this.prisma.post.delete({
            where : {id: postId},
        });

        return {message : 'Post deleted successfully'};
    }


    //add a comment
    async addComment(postId: number, userId : number, dto: CreateCommentDto){
        //1.check if post actually exist
        const post = await this.prisma.post.findUnique({
            where : {id : postId},
        });

        if(!post){
            throw new NotFoundException('Post not found. It may have been deleted.')
        }

        //create a comment
        const comment = await this.prisma.comment.create({
            data: {
                
                    content : dto.content,
                    postId : postId,
                    authorId : userId,
                },
            
        });

        return {message : 'Comment added successfully' , comment};

    }
}
