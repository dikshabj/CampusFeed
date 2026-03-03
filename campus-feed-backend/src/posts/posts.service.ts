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
    constructor(private prisma: PrismaService,
        private awsService: AwsService,
        private notificationsGateway: NotificationsGateway
    ) { }

    async createPost(userId: number, dto: createPostDto, file?: Express.Multer.File) {
        try {
            let fileUrl: string | null = null;
            if (file) {
                fileUrl = await this.awsService.uploadFile(file, 'posts');
            }
            const newPost = await this.prisma.post.create({
                data: {
                    title: dto.title,
                    description: dto.description,
                    type: dto.type as PostType || 'NOTICE',
                    isPriority: dto.isPriority || false,
                    targetBranch: dto.targetBranch,
                    targetSemester: dto.targetSemester,
                    authorId: userId,
                    attachmentUrl: fileUrl,
                }
            });

            this.notificationsGateway.sendNewPostAlert(newPost.title, newPost.type);

            return {
                message: 'Post created successfully',
                post: newPost
            };
        } catch (error) {
            console.error('Error creating post: ', error);
            throw new InternalServerErrorException('Failed to create the post. Please try again later.')
        }
    }

    async getFeed(userId: number, role: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { branch: true, semester: true },
            });

            const feedIncludeQuery = {
                author: { select: { name: true, role: true } },
                comments: {
                    include: {
                        author: { select: { name: true, role: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            };

            if (role === 'FACULTY') {
                return await this.prisma.post.findMany({
                    orderBy: { createdAt: 'desc' },
                    include: {
                        author: { select: { name: true, role: true } },
                    },
                });
            }

            const posts = await this.prisma.post.findMany({
                where: {
                    OR: [
                        { targetBranch: null, targetSemester: null },
                        { targetBranch: user?.branch, targetSemester: null },
                        { targetBranch: null, targetSemester: user?.semester },
                        { targetBranch: user?.branch, targetSemester: user?.semester }
                    ],
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    author: { select: { name: true, role: true } },
                },
            });

            return {
                message: 'Feed fetched successfully',
                count: posts.length,
                posts: posts,
            };
        } catch (error) {
            console.error('Error fetching feed:', error);
            throw new InternalServerErrorException('Failed to fetch the feed.')
        }
    }

    async updatePost(postId: number, userId: number, dto: UpdatePostDto) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        if (!post) throw new NotFoundException('Post not found');
        if (post.authorId !== userId) throw new ForbiddenException('Access Denied');

        const updatedPost = await this.prisma.post.update({
            where: { id: postId },
            data: dto,
        });
        return { message: 'Post updated successfully', post: updatedPost };
    }

    async deletePost(postId: number, userId: number) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        if (!post) throw new NotFoundException('Post not found');
        if (post.authorId !== userId) throw new ForbiddenException('Access denied');

        await this.prisma.post.delete({ where: { id: postId } });
        return { message: 'Post deleted successfully' };
    }

    async addComment(postId: number, userId: number, dto: CreateCommentDto) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        if (!post) throw new NotFoundException('Post not found');

        const comment = await this.prisma.comment.create({
            data: {
                content: dto.content,
                postId: postId,
                authorId: userId,
            },
        });

        // Specific post notification
        this.notificationsGateway.server.emit(`comment_${postId}`, {
            message: `New comment on "${post.title}"`,
            comment,
            time: new Date().toISOString(),
        });

        // Global broadcast for sound
        this.notificationsGateway.server.emit('global_comment', {
            message: `New comment on ${post.title}`,
        });

        return { message: 'Comment added successfully', comment };
    }
}
