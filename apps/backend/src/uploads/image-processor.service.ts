import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const MAX_WIDTH = 1600;

@Injectable()
export class ImageProcessorService {
  async process(buffer: Buffer): Promise<{ filename: string; publicUrl: string }> {
    const uploadsDir = process.env.UPLOADS_DIR ?? './uploads';
    fs.mkdirSync(uploadsDir, { recursive: true });

    const filename = `${randomUUID()}.webp`;
    const outputPath = path.join(uploadsDir, filename);

    await sharp(buffer)
      .rotate()
      .resize({ width: MAX_WIDTH, height: MAX_WIDTH, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outputPath);

    const base = process.env.PUBLIC_UPLOADS_BASE_URL ?? 'http://localhost:3000/uploads';
    return { filename, publicUrl: `${base}/${filename}` };
  }
}
