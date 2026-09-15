import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { PRIVATE_BAR_CATALOG } from './catalog';

/**
 * The catalogue promises a file at a path. This is the test that checks the file
 * is actually there — a broken <img> on a guest's phone is not something a type
 * can catch, and every product card depends on it.
 */
const PUBLIC_DIR = path.resolve(__dirname, '../../public');

describe('Private Bar product photography', () => {
  it('has every declared variant on disk, as a non-empty WebP', () => {
    for (const product of PRIVATE_BAR_CATALOG) {
      const image = product.image;
      expect(image, `${product.id} declares no image`).not.toBeNull();
      if (!image) continue;

      for (const width of image.widths) {
        const file = path.join(PUBLIC_DIR, `${image.basePath}-${width}.webp`);
        expect(existsSync(file), `missing asset: ${image.basePath}-${width}.webp`).toBe(true);
        expect(statSync(file).size, `empty asset: ${image.basePath}-${width}.webp`).toBeGreaterThan(1024);
      }
    }
  });

  it('declares the intrinsic height of the 240 px file, so the layout never shifts', async () => {
    // Read straight from the WebP header rather than trusting the number: a
    // wrong height reserves the wrong box and the page jumps when the image
    // lands.
    for (const product of PRIVATE_BAR_CATALOG) {
      const image = product.image;
      if (!image) continue;
      const file = path.join(PUBLIC_DIR, `${image.basePath}-240.webp`);
      const { width, height } = readWebpSize(file);
      expect(width, `${product.id}: declared width`).toBe(image.width);
      expect(height, `${product.id}: declared height`).toBe(image.height);
    }
  });
});

/** Minimal VP8X/VP8L/VP8 dimension reader — no image dependency in the test suite. */
function readWebpSize(file: string): { width: number; height: number } {
  const buf = readFileSync(file);
  const fourCC = buf.toString('ascii', 12, 16);
  if (fourCC === 'VP8X') {
    return {
      width: 1 + buf.readUIntLE(24, 3),
      height: 1 + buf.readUIntLE(27, 3),
    };
  }
  if (fourCC === 'VP8L') {
    const bits = buf.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }
  // lossy VP8: dimensions sit after the 3-byte start code in the frame header
  return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
}
