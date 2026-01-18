/**
 * Dithering algorithms for thermal printer output
 * Floyd-Steinberg dithering produces good results for thermal printers
 */

export class Dithering {
  /**
   * Apply Floyd-Steinberg dithering to convert image to black & white
   * This produces a halftone-like effect that works well on thermal printers
   */
  static floydSteinberg(imageData: ImageData): ImageData {
    const width = imageData.width;
    const height = imageData.height;

    // Create a copy of the image data
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      width,
      height
    );

    // Convert to grayscale first
    const grayscale = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = result.data[i * 4];
      const g = result.data[i * 4 + 1];
      const b = result.data[i * 4 + 2];
      // Use luminance formula
      grayscale[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // Apply Floyd-Steinberg dithering
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const oldPixel = grayscale[idx];
        const newPixel = oldPixel < 128 ? 0 : 255;
        const error = oldPixel - newPixel;

        grayscale[idx] = newPixel;

        // Distribute error to neighboring pixels
        if (x + 1 < width) {
          grayscale[idx + 1] += error * 7 / 16;
        }
        if (y + 1 < height) {
          if (x > 0) {
            grayscale[idx + width - 1] += error * 3 / 16;
          }
          grayscale[idx + width] += error * 5 / 16;
          if (x + 1 < width) {
            grayscale[idx + width + 1] += error * 1 / 16;
          }
        }
      }
    }

    // Write back to image data
    for (let i = 0; i < width * height; i++) {
      const value = grayscale[i] < 128 ? 0 : 255;
      result.data[i * 4] = value;
      result.data[i * 4 + 1] = value;
      result.data[i * 4 + 2] = value;
      result.data[i * 4 + 3] = 255;
    }

    return result;
  }

  /**
   * Apply Atkinson dithering - produces lighter output, good for photos
   */
  static atkinson(imageData: ImageData): ImageData {
    const width = imageData.width;
    const height = imageData.height;

    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      width,
      height
    );

    const grayscale = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = result.data[i * 4];
      const g = result.data[i * 4 + 1];
      const b = result.data[i * 4 + 2];
      grayscale[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const oldPixel = grayscale[idx];
        const newPixel = oldPixel < 128 ? 0 : 255;
        const error = (oldPixel - newPixel) / 8; // Atkinson uses 1/8

        grayscale[idx] = newPixel;

        // Atkinson diffusion pattern
        if (x + 1 < width) grayscale[idx + 1] += error;
        if (x + 2 < width) grayscale[idx + 2] += error;
        if (y + 1 < height) {
          if (x > 0) grayscale[idx + width - 1] += error;
          grayscale[idx + width] += error;
          if (x + 1 < width) grayscale[idx + width + 1] += error;
        }
        if (y + 2 < height) {
          grayscale[idx + width * 2] += error;
        }
      }
    }

    for (let i = 0; i < width * height; i++) {
      const value = grayscale[i] < 128 ? 0 : 255;
      result.data[i * 4] = value;
      result.data[i * 4 + 1] = value;
      result.data[i * 4 + 2] = value;
      result.data[i * 4 + 3] = 255;
    }

    return result;
  }

  /**
   * Simple threshold - for high contrast images
   */
  static threshold(imageData: ImageData, level: number = 128): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    for (let i = 0; i < result.data.length; i += 4) {
      const gray = 0.299 * result.data[i] + 0.587 * result.data[i + 1] + 0.114 * result.data[i + 2];
      const value = gray < level ? 0 : 255;
      result.data[i] = value;
      result.data[i + 1] = value;
      result.data[i + 2] = value;
    }

    return result;
  }
}
