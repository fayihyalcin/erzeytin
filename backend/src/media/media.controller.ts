import {
  Controller,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UnsupportedMediaTypeException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MediaService, type UploadedMediaFile } from './media.service';
import {
  ensureUploadTargetDir,
  resolveFileExtension,
  sanitizeFileNameBase,
} from './media.utils';

const ALLOWED_MIME_TYPES = new Set([
  'application/msword',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
  'text/plain',
  'video/mp4',
  'video/ogg',
  'video/webm',
]);

function resolveMaxFiles() {
  const raw = Number(process.env.UPLOAD_MAX_FILES ?? '20');
  return Number.isFinite(raw) && raw > 0 ? raw : 20;
}

function resolveMaxFileSizeBytes() {
  const raw = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB ?? '12');
  const safeValue = Number.isFinite(raw) && raw > 0 ? raw : 12;
  return Math.trunc(safeValue * 1024 * 1024);
}

function createStoredFilename(originalName: string, mimeType: string) {
  const extension = resolveFileExtension(originalName, mimeType);
  const baseName = originalName.includes('.')
    ? originalName.slice(0, originalName.lastIndexOf('.'))
    : originalName;

  return `${Date.now()}-${randomUUID()}-${sanitizeFileNameBase(baseName)}${extension}`;
}

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', resolveMaxFiles(), {
      fileFilter: (_request, file, callback) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          callback(
            new UnsupportedMediaTypeException(
              'Bu dosya tipi desteklenmiyor.',
            ) as unknown as Error,
            false,
          );
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: resolveMaxFileSizeBytes(),
      },
      storage: diskStorage({
        destination: (request, _file, callback) => {
          try {
            const folder =
              typeof request.query.folder === 'string'
                ? request.query.folder
                : undefined;

            callback(
              null,
              ensureUploadTargetDir(process.env.UPLOAD_DIR, folder),
            );
          } catch (error) {
            callback(error as Error, '');
          }
        },
        filename: (_request, file, callback) => {
          try {
            callback(
              null,
              createStoredFilename(file.originalname, file.mimetype),
            );
          } catch (error) {
            callback(error as Error, '');
          }
        },
      }),
    }),
  )
  upload(
    @UploadedFiles() files: UploadedMediaFile[],
    @Query('folder') folder: string | undefined,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Yetki bilgisi bulunamadi.');
    }

    return this.mediaService.upload(files, request, folder);
  }
}
