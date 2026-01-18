import { ImageProcessor } from '@/lib/utils/image-processor';

export interface PrintImageOptions {
  maxWidth?: number;
  sobelThreshold?: number;
  invert?: boolean;
}

export class PrintService {
  /**
   * Process an image for thermal printing using edge detection
   */
  static async processImageForPrint(
    imageSource: string | HTMLImageElement,
    options: PrintImageOptions = {}
  ): Promise<ImageData> {
    const { maxWidth = 384, sobelThreshold = 50, invert = true } = options;

    // Load image if string
    let img: HTMLImageElement;
    if (typeof imageSource === 'string') {
      img = await ImageProcessor.loadImageFromBase64(imageSource);
    } else {
      img = imageSource;
    }

    // Convert to ImageData
    const imageData = ImageProcessor.imageToImageData(img, maxWidth);

    // Apply edge detection for thermal printer
    return ImageProcessor.processImageWithEdgeDetection(imageData, 'sobel', {
      sobelThreshold,
      invert,
    });
  }

  /**
   * Process a URL image for thermal printing
   */
  static async processUrlImageForPrint(
    url: string,
    options: PrintImageOptions = {}
  ): Promise<ImageData> {
    const { maxWidth = 384, sobelThreshold = 50, invert = true } = options;

    const img = await ImageProcessor.loadImage(url);
    const imageData = ImageProcessor.imageToImageData(img, maxWidth);

    return ImageProcessor.processImageWithEdgeDetection(imageData, 'sobel', {
      sobelThreshold,
      invert,
    });
  }

  /**
   * Create text image for printing
   */
  static createTextImage(
    text: string,
    options?: {
      fontSize?: number;
      lineHeight?: number;
      padding?: number;
      width?: number;
    }
  ): ImageData {
    return ImageProcessor.textToImageData(text, {
      fontSize: options?.fontSize ?? 24,
      lineHeight: options?.lineHeight ?? 1.4,
      padding: options?.padding ?? 20,
      width: options?.width ?? 384,
    });
  }

  /**
   * Create a centered label image for printing
   */
  static createLabelImage(
    text: string,
    options?: {
      fontSize?: number;
      paddingY?: number;
      width?: number;
    }
  ): ImageData {
    return ImageProcessor.labelToImageData(text, {
      fontSize: options?.fontSize ?? 20,
      paddingY: options?.paddingY ?? 15,
      width: options?.width ?? 384,
    });
  }

  /**
   * Format hamster attributes as "I am: word1, word2, word3"
   */
  static formatHamsterAttributes(words: string[]): string {
    const formatted = words.slice(0, 3).map(w => w.toLowerCase()).join(', ');
    return `I am: ${formatted}`;
  }
}
