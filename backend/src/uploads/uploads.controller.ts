import {
  Post,
  Request,
  UseGuards,
  Controller,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtGuard } from '../auth/guards/jwt.guard';

import { ERROR_CODES } from '../constants/error/error-codes';

import { UploadsService } from './uploads.service';
import { ALLOWED_IMAGE_TYPES, IMAGE_LIMITS, IMAGE_ONLY_MESSAGE, IMAGE_REQUIRED_MESSAGE } from './uploads.constants';

import type { Request as ExpressRequest } from 'express';
import type { JwtPayload } from '../auth/interfaces/jwt.interface';
import type { UploadFileFilterCallback, UploadFileFilterPayload, UploadedFilePayload } from './uploads.types';

// 타입 정의
type AuthRequest = ExpressRequest & { user: JwtPayload };

// 필터 이미지
/**
 * 이미지 필터
 * @description 허용된 이미지 타입만 통과
 */
const imageFileFilter = (_req: ExpressRequest, file: UploadFileFilterPayload, callback: UploadFileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    return callback(null, true);
  }

  const error = new BadRequestException({
    message: IMAGE_ONLY_MESSAGE,
    code: ERROR_CODES.VALIDATION_FAILED,
  });

  return callback(error, false);
};

// 인터셉터 업로드
const IMAGE_UPLOAD_INTERCEPTOR = FileInterceptor('file', {
  limits: IMAGE_LIMITS,
  fileFilter: imageFileFilter,
});

@Controller('uploads')
export class UploadsController {
  /**
   * 업로드 컨트롤러
   * @description 업로드 관련 요청을 처리
   */
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * 파일 확인
   * @description 업로드 파일 유무를 검증
   */
  private getRequiredFile(file: UploadedFilePayload | undefined) {
    if (!file) {
      throw new BadRequestException({
        message: IMAGE_REQUIRED_MESSAGE,
        code: ERROR_CODES.VALIDATION_FAILED,
      });
    }

    return file;
  }

  /**
   * 썸네일 업로드
   * @description 썸네일 이미지를 업로드
   */
  @UseGuards(JwtGuard)
  @Post('thumbnail')
  @UseInterceptors(IMAGE_UPLOAD_INTERCEPTOR)
  uploadThumbnail(@UploadedFile() file: UploadedFilePayload | undefined, @Request() req: AuthRequest) {
    // 파일 검증
    const requiredFile = this.getRequiredFile(file);

    // 업로드 처리
    return this.uploadsService.uploadThumbnail(requiredFile, req.user.sub);
  }

  /**
   * 이미지 업로드
   * @description 본문 이미지를 업로드
   */
  @UseGuards(JwtGuard)
  @Post('image')
  @UseInterceptors(IMAGE_UPLOAD_INTERCEPTOR)
  uploadImage(@UploadedFile() file: UploadedFilePayload | undefined, @Request() req: AuthRequest) {
    // 파일 검증
    const requiredFile = this.getRequiredFile(file);

    // 업로드 처리
    return this.uploadsService.uploadImage(requiredFile, req.user.sub);
  }

  /**
   * 아바타 업로드
   * @description 프로필 아바타 이미지를 업로드
   */
  @UseGuards(JwtGuard)
  @Post('avatar')
  @UseInterceptors(IMAGE_UPLOAD_INTERCEPTOR)
  uploadAvatar(@UploadedFile() file: UploadedFilePayload | undefined, @Request() req: AuthRequest) {
    // 파일 검증
    const requiredFile = this.getRequiredFile(file);

    // 업로드 처리
    return this.uploadsService.uploadAvatar(requiredFile, req.user.sub);
  }
}
