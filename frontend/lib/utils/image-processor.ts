import { EdgeDetection } from './edge-detection';

export class ImageProcessor {
  /**
   * Load image from file
   */
  static loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target?.result as string;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Load image from URL
   */
  static loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Convert image to ImageData for processing
   */
  static imageToImageData(
    image: HTMLImageElement,
    maxWidth: number = 384
  ): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Scale image
    const scale = Math.min(maxWidth / image.width, 1);
    canvas.width = Math.floor(image.width * scale);
    canvas.height = Math.floor(image.height * scale);

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  /**
   * Process image with edge detection
   */
  static processImageWithEdgeDetection(
    imageData: ImageData,
    algorithm: 'sobel' | 'canny' = 'sobel',
    options?: {
      sobelThreshold?: number;
      cannyLowThreshold?: number;
      cannyHighThreshold?: number;
      invert?: boolean;
    }
  ): ImageData {
    let processed: ImageData;

    if (algorithm === 'sobel') {
      processed = EdgeDetection.applySobelEdgeDetection(
        imageData,
        options?.sobelThreshold || 50
      );
    } else {
      processed = EdgeDetection.applyCannyEdgeDetection(
        imageData,
        options?.cannyLowThreshold || 50,
        options?.cannyHighThreshold || 100
      );
    }

    // Invert for better thermal printing (black lines on white background)
    if (options?.invert !== false) {
      processed = EdgeDetection.invertImage(processed);
    }

    return processed;
  }

  /**
   * Convert ImageData to data URL for preview
   */
  static imageDataToDataUrl(imageData: ImageData): string {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  }
}
