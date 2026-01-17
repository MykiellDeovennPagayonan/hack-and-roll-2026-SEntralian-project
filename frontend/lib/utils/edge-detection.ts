export class EdgeDetection {
  /**
   * Apply Sobel edge detection to an image
   */
  static applySobelEdgeDetection(
    imageData: ImageData,
    threshold: number = 50
  ): ImageData {
    const { width, height, data } = imageData;
    const output = new ImageData(width, height);

    // Sobel kernels
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1]
    ];

    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1]
    ];

    // Convert to grayscale first
    const grayscale = this.toGrayscale(imageData);

    // Apply Sobel operator
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let pixelX = 0;
        let pixelY = 0;

        // Convolve with Sobel kernels
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const pixel = grayscale.data[idx];

            pixelX += pixel * sobelX[ky + 1][kx + 1];
            pixelY += pixel * sobelY[ky + 1][kx + 1];
          }
        }

        // Calculate gradient magnitude
        const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY);

        // Apply threshold
        const edge = magnitude > threshold ? 255 : 0;

        // Set output pixel (white edges on black background)
        const outputIdx = (y * width + x) * 4;
        output.data[outputIdx] = edge;     // R
        output.data[outputIdx + 1] = edge; // G
        output.data[outputIdx + 2] = edge; // B
        output.data[outputIdx + 3] = 255;  // A
      }
    }

    return output;
  }

  /**
   * Apply Canny edge detection (simplified version)
   */
  static applyCannyEdgeDetection(
    imageData: ImageData,
    lowThreshold: number = 50,
    highThreshold: number = 100
  ): ImageData {
    const { width, height } = imageData;

    // Step 1: Apply Gaussian blur to reduce noise
    const blurred = this.gaussianBlur(imageData, 1.4);

    // Step 2: Calculate gradients
    const gradients = this.calculateGradients(blurred);

    // Step 3: Non-maximum suppression
    const suppressed = this.nonMaximumSuppression(gradients, width, height);

    // Step 4: Double threshold and edge tracking by hysteresis
    const edges = this.hysteresis(suppressed, width, height, lowThreshold, highThreshold);

    // Convert back to ImageData
    const output = new ImageData(width, height);
    for (let i = 0; i < edges.length; i++) {
      const idx = i * 4;
      const value = edges[i] ? 255 : 0;
      output.data[idx] = value;
      output.data[idx + 1] = value;
      output.data[idx + 2] = value;
      output.data[idx + 3] = 255;
    }

    return output;
  }

  /**
   * Convert image to grayscale
   */
  private static toGrayscale(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const output = new ImageData(width, height);

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      output.data[i] = gray;
      output.data[i + 1] = gray;
      output.data[i + 2] = gray;
      output.data[i + 3] = data[i + 3];
    }

    return output;
  }

  /**
   * Apply Gaussian blur
   */
  private static gaussianBlur(imageData: ImageData, sigma: number): ImageData {
    const { width, height, data } = imageData;
    const output = new ImageData(width, height);

    // Generate Gaussian kernel
    const kernelSize = Math.ceil(sigma * 3) * 2 + 1;
    const kernel = this.generateGaussianKernel(kernelSize, sigma);
    const halfSize = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const pixelY = Math.min(Math.max(y + ky - halfSize, 0), height - 1);
            const pixelX = Math.min(Math.max(x + kx - halfSize, 0), width - 1);
            const idx = (pixelY * width + pixelX) * 4;
            const weight = kernel[ky][kx];

            r += data[idx] * weight;
            g += data[idx + 1] * weight;
            b += data[idx + 2] * weight;
            a += data[idx + 3] * weight;
          }
        }

        const outIdx = (y * width + x) * 4;
        output.data[outIdx] = r;
        output.data[outIdx + 1] = g;
        output.data[outIdx + 2] = b;
        output.data[outIdx + 3] = a;
      }
    }

    return output;
  }

  /**
   * Generate Gaussian kernel
   */
  private static generateGaussianKernel(size: number, sigma: number): number[][] {
    const kernel: number[][] = [];
    const halfSize = Math.floor(size / 2);
    let sum = 0;

    for (let y = 0; y < size; y++) {
      kernel[y] = [];
      for (let x = 0; x < size; x++) {
        const exponent = -((x - halfSize) ** 2 + (y - halfSize) ** 2) / (2 * sigma ** 2);
        kernel[y][x] = Math.exp(exponent);
        sum += kernel[y][x];
      }
    }

    // Normalize
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        kernel[y][x] /= sum;
      }
    }

    return kernel;
  }

  /**
   * Calculate gradients (magnitude and direction)
   */
  private static calculateGradients(imageData: ImageData): {
    magnitude: number[];
    direction: number[];
  } {
    const { width, height, data } = imageData;
    const magnitude: number[] = [];
    const direction: number[] = [];

    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0;
        let gy = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const pixel = data[idx];
            gx += pixel * sobelX[ky + 1][kx + 1];
            gy += pixel * sobelY[ky + 1][kx + 1];
          }
        }

        const idx = y * width + x;
        magnitude[idx] = Math.sqrt(gx * gx + gy * gy);
        direction[idx] = Math.atan2(gy, gx);
      }
    }

    return { magnitude, direction };
  }

  /**
   * Non-maximum suppression
   */
  private static nonMaximumSuppression(
    gradients: { magnitude: number[]; direction: number[] },
    width: number,
    height: number
  ): number[] {
    const { magnitude, direction } = gradients;
    const output: number[] = new Array(width * height).fill(0);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const angle = direction[idx] * (180 / Math.PI);
        const normalizedAngle = ((angle % 180) + 180) % 180;

        let neighbor1 = 0;
        let neighbor2 = 0;

        // Check neighbors based on gradient direction
        if ((normalizedAngle >= 0 && normalizedAngle < 22.5) || (normalizedAngle >= 157.5 && normalizedAngle <= 180)) {
          neighbor1 = magnitude[idx - 1];
          neighbor2 = magnitude[idx + 1];
        } else if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) {
          neighbor1 = magnitude[idx - width + 1];
          neighbor2 = magnitude[idx + width - 1];
        } else if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) {
          neighbor1 = magnitude[idx - width];
          neighbor2 = magnitude[idx + width];
        } else {
          neighbor1 = magnitude[idx - width - 1];
          neighbor2 = magnitude[idx + width + 1];
        }

        if (magnitude[idx] >= neighbor1 && magnitude[idx] >= neighbor2) {
          output[idx] = magnitude[idx];
        }
      }
    }

    return output;
  }

  /**
   * Hysteresis thresholding
   */
  private static hysteresis(
    edges: number[],
    width: number,
    height: number,
    lowThreshold: number,
    highThreshold: number
  ): boolean[] {
    const output: boolean[] = new Array(width * height).fill(false);
    const strong: boolean[] = new Array(width * height).fill(false);

    // Classify edges
    for (let i = 0; i < edges.length; i++) {
      if (edges[i] >= highThreshold) {
        output[i] = true;
        strong[i] = true;
      } else if (edges[i] >= lowThreshold) {
        // Weak edge, needs validation
        output[i] = false;
      }
    }

    // Edge tracking - connect weak edges to strong edges
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;

        if (edges[idx] >= lowThreshold && edges[idx] < highThreshold) {
          // Check if connected to strong edge
          if (
            strong[idx - width - 1] || strong[idx - width] || strong[idx - width + 1] ||
            strong[idx - 1] || strong[idx + 1] ||
            strong[idx + width - 1] || strong[idx + width] || strong[idx + width + 1]
          ) {
            output[idx] = true;
          }
        }
      }
    }

    return output;
  }

  /**
   * Invert image (for better thermal printing - black edges on white)
   */
  static invertImage(imageData: ImageData): ImageData {
    const output = new ImageData(imageData.width, imageData.height);

    for (let i = 0; i < imageData.data.length; i += 4) {
      output.data[i] = 255 - imageData.data[i];
      output.data[i + 1] = 255 - imageData.data[i + 1];
      output.data[i + 2] = 255 - imageData.data[i + 2];
      output.data[i + 3] = imageData.data[i + 3];
    }

    return output;
  }
}
