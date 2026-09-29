import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ImageProcessorService } from './image-processor.service';
import sharp from 'sharp';

describe('ImageProcessorService', () => {
  const uploadsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uploads-'));
  const service = new ImageProcessorService();

  beforeAll(() => {
    process.env.UPLOADS_DIR = uploadsDir;
    process.env.PUBLIC_UPLOADS_BASE_URL = 'http://localhost:3000/uploads';
  });

  it('resizes and converts an image to webp on disk', async () => {
    const input = await sharp({
      create: { width: 3000, height: 2000, channels: 3, background: '#fff' },
    })
      .png()
      .toBuffer();

    const result = await service.process(input);

    expect(result.filename).toMatch(/\.webp$/);
    expect(result.publicUrl).toBe(`http://localhost:3000/uploads/${result.filename}`);

    const savedPath = `${uploadsDir}/${result.filename}`;
    expect(fs.existsSync(savedPath)).toBe(true);

    const meta = await sharp(savedPath).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBeLessThanOrEqual(1600);
  });
});
