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
   * Load image from URL (fetches as blob to avoid CORS issues)
   */
  static async loadImage(url: string): Promise<HTMLImageElement> {
    // Fetch as blob to avoid CORS issues with canvas
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
      img.src = objectUrl;
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

  /**
   * Render text to ImageData for thermal printing
   */
  static textToImageData(
    text: string,
    options?: {
      width?: number;
      fontSize?: number;
      fontFamily?: string;
      lineHeight?: number;
      padding?: number;
    }
  ): ImageData {
    const width = options?.width || 384;
    const fontSize = options?.fontSize || 16;
    const fontFamily = options?.fontFamily || 'monospace';
    const lineHeight = options?.lineHeight || 1.4;
    const padding = options?.padding || 10;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Set font for text measurement
    ctx.font = `${fontSize}px ${fontFamily}`;

    // Calculate text wrapping
    const maxWidth = width - padding * 2;
    const lines: string[] = [];
    const paragraphs = text.split('\n');

    for (const paragraph of paragraphs) {
      const words = paragraph.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }
    }

    // Calculate canvas height
    const lineHeightPx = fontSize * lineHeight;
    const height = Math.ceil(lines.length * lineHeightPx + padding * 2);

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Fill white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Draw text
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = 'black';
    ctx.textBaseline = 'top';

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], padding, padding + i * lineHeightPx);
    }

    return ctx.getImageData(0, 0, width, height);
  }

  /**
   * Render a label (centered text with word wrap) to ImageData
   */
  static labelToImageData(
    text: string,
    options?: {
      width?: number;
      fontSize?: number;
      fontFamily?: string;
      paddingY?: number;
      paddingX?: number;
      lineHeight?: number;
    }
  ): ImageData {
    const width = options?.width || 384;
    const fontSize = options?.fontSize || 20;
    const fontFamily = options?.fontFamily || 'monospace';
    const paddingY = options?.paddingY || 15;
    const paddingX = options?.paddingX || 10;
    const lineHeight = options?.lineHeight || 1.3;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Set font for text measurement
    ctx.font = `bold ${fontSize}px ${fontFamily}`;

    // Calculate text wrapping
    const maxWidth = width - paddingX * 2;
    const lines: string[] = [];
    const words = text.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    // Calculate height based on number of lines
    const lineHeightPx = fontSize * lineHeight;
    const height = Math.ceil(lines.length * lineHeightPx + paddingY * 2);

    canvas.width = width;
    canvas.height = height;

    // Fill white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Draw centered text
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], width / 2, paddingY + i * lineHeightPx);
    }

    return ctx.getImageData(0, 0, width, height);
  }

  /**
   * Load image from base64 (with or without data URL prefix)
   */
  static loadImageFromBase64(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      // Ensure it has the data URL prefix
      if (base64.startsWith('data:')) {
        img.src = base64;
      } else {
        img.src = `data:image/jpeg;base64,${base64}`;
      }
    });
  }
}
