import {
  BadRequestException,
  Controller,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

import { UploadsService } from './uploads.service';
import type { UploadedFilePayload } from './uploads.types';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ERROR_CODES } from '../constants/error/error-codes';

import type { JwtPayload } from '../auth/interfaces/jwt.interface';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @UseGuards(JwtGuard)
  @Post('thumbnail')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
          return callback(
            new BadRequestException({
              message: '이미지 파일만 업로드할 수 있습니다.',
              code: ERROR_CODES.VALIDATION_FAILED,
            }),
            false,
          );
        }
        return callback(null, true);
      },
    }),
  )
  uploadThumbnail(
    @UploadedFile() file: UploadedFilePayload | undefined,
    @Request() req: ExpressRequest & { user: JwtPayload },
  ) {
    if (!file) {
      throw new BadRequestException({
        message: '이미지 파일을 선택해주세요.',
        code: ERROR_CODES.VALIDATION_FAILED,
      });
    }

    return this.uploadsService.uploadThumbnail(file, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
          return callback(
            new BadRequestException({
              message: '이미지 파일만 업로드할 수 있습니다.',
              code: ERROR_CODES.VALIDATION_FAILED,
            }),
            false,
          );
        }
        return callback(null, true);
      },
    }),
  )
  uploadImage(
    @UploadedFile() file: UploadedFilePayload | undefined,
    @Request() req: ExpressRequest & { user: JwtPayload },
  ) {
    if (!file) {
      throw new BadRequestException({
        message: '이미지 파일을 선택해주세요.',
        code: ERROR_CODES.VALIDATION_FAILED,
      });
    }

    return this.uploadsService.uploadImage(file, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
          return callback(
            new BadRequestException({
              message: '이미지 파일만 업로드할 수 있습니다.',
              code: ERROR_CODES.VALIDATION_FAILED,
            }),
            false,
          );
        }
        return callback(null, true);
      },
    }),
  )
  uploadAvatar(
    @UploadedFile() file: UploadedFilePayload | undefined,
    @Request() req: ExpressRequest & { user: JwtPayload },
  ) {
    if (!file) {
      throw new BadRequestException({
        message: '이미지 파일을 선택해주세요.',
        code: ERROR_CODES.VALIDATION_FAILED,
      });
    }

    return this.uploadsService.uploadAvatar(file, req.user.sub);
  }
}
