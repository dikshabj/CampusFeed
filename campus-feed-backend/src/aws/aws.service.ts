import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as path from 'path';
import { Multer } from 'multer';

@Injectable()
export class AwsService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    //  Production Standard: Never hardcode keys! Always read from ConfigService
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME') || '';
    
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION') || '',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  // This function takes a file caught by Multer and uploads it to S3
  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string>
   {
    //promise means function turant value nahi dega thode time bad dega
    try {
      // 1. Create a unique file name so we don't accidentally overwrite existing files
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);
      const fileName = `${folder}/${uniqueSuffix}${extension}`;

      // 2. Prepare the command to send to AWS
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName, // The name of the file in the bucket
        Body: file.buffer, // The actual file data
        ContentType: file.mimetype, // Tells S3 if it's a PDF, JPG, etc.
      });

      // 3. Send it!
      await this.s3Client.send(command);

      // 4. Return the public URL so we can save it in PostgreSQL
      const region = await this.s3Client.config.region();
      return `https://${this.bucketName}.s3.${region}.amazonaws.com/${fileName}`;

    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new InternalServerErrorException('Failed to upload file to the cloud.');
    }
  }
}