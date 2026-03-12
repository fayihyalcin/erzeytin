import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { relative, sep } from 'node:path';
import type { Request } from 'express';
import {
  buildPublicUploadUrl,
  detectMediaType,
  normalizeMediaFolderLabel,
  resolveUploadRoot,
} from './media.utils';

export interface UploadedMediaFile {
  filename: string;
  mimetype: string;
  originalname: string;
  path: string;
  size: number;
}

@Injectable()
export class MediaService {
  constructor(private readonly configService: ConfigService) {}

  upload(files: UploadedMediaFile[], request: Request, folder?: string) {
    if (!files.length) {
      throw new BadRequestException('En az bir dosya secmelisiniz.');
    }

    const uploadRoot = resolveUploadRoot(this.configService.get<string>('UPLOAD_DIR'));
    const folderLabel = normalizeMediaFolderLabel(folder);

    return {
      items: files.map((file) => {
        const relativePath = relative(uploadRoot, file.path).split(sep).join('/');
        const publicPath = `/uploads/${relativePath}`;

        return {
          folder: folderLabel,
          filename: file.filename,
          mimeType: file.mimetype,
          originalName: file.originalname,
          path: publicPath,
          size: file.size,
          type: detectMediaType(file.mimetype),
          url: buildPublicUploadUrl(request, publicPath),
        };
      }),
      uploadedAt: new Date().toISOString(),
    };
  }
}
