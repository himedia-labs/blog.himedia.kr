import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { ConfigType } from '@nestjs/config';
import { randomUUID } from 'crypto';
import path from 'path';

import appConfig from '../common/config/app.config';
import { ERROR_CODES } from '../constants/error/error-codes';
import type { UploadedFilePayload } from './uploads.types';

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

@Injectable()
export class UploadsService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(@Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>) {
    this.bucket = this.config.r2.bucket;
    this.publicUrl = this.config.r2.publicUrl.replace(/\/$/, '');
    this.client = new S3Client({
      region: this.config.r2.region,
      endpoint: this.config.r2.endpoint,
      credentials: {
        accessKeyId: this.config.r2.accessKeyId,
        secretAccessKey: this.config.r2.secretAccessKey,
      },
    });
  }

  private async uploadImageFile(file: UploadedFilePayload, userId: string, prefix: string) {
    if (!file) {
      throw new BadRequestException({
        message: '이미지 파일을 선택해주세요.',
        code: ERROR_CODES.VALIDATION_FAILED,
      });
    }

    const extension = path.extname(file.originalname) || MIME_EXTENSION_MAP[file.mimetype] || '';
    const key = `${prefix}/${userId}/${Date.now()}-${randomUUID()}${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return { url: `${this.publicUrl}/${key}` };
  }

  async uploadThumbnail(file: UploadedFilePayload, userId: string) {
    return this.uploadImageFile(file, userId, 'thumbnails');
  }

  async uploadImage(file: UploadedFilePayload, userId: string) {
    return this.uploadImageFile(file, userId, 'images');
  }

  async uploadAvatar(file: UploadedFilePayload, userId: string) {
    return this.uploadImageFile(file, userId, 'avatars');
  }
}
