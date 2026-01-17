'use client';

import { useState, useCallback } from 'react';
import { ImageProcessor } from '@/lib/utils/image-processor';

export interface EdgeDetectionSettings {
  algorithm: 'sobel' | 'canny';
  sobelThreshold: number;
  cannyLowThreshold: number;
  cannyHighThreshold: number;
  invert: boolean;
}

export function useEdgeDetection() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [settings, setSettings] = useState<EdgeDetectionSettings>({
    algorithm: 'sobel',
    sobelThreshold: 50,
    cannyLowThreshold: 50,
    cannyHighThreshold: 100,
    invert: true,
  });

  // Process image with given settings
  const processImageWithSettings = useCallback(
    async (img: HTMLImageElement, currentSettings: EdgeDetectionSettings) => {
      setIsProcessing(true);
      try {
        // Convert to ImageData
        const imageData = ImageProcessor.imageToImageData(img);

        // Apply edge detection
        const processed = ImageProcessor.processImageWithEdgeDetection(
          imageData,
          currentSettings.algorithm,
          {
            sobelThreshold: currentSettings.sobelThreshold,
            cannyLowThreshold: currentSettings.cannyLowThreshold,
            cannyHighThreshold: currentSettings.cannyHighThreshold,
            invert: currentSettings.invert,
          }
        );

        setProcessedImageData(processed);

        // Create preview URL
        const dataUrl = ImageProcessor.imageDataToDataUrl(processed);
        setPreviewUrl(dataUrl);
      } catch (error) {
        console.error('Error processing image:', error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // Load image from file
  const loadImage = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const img = await ImageProcessor.loadImageFromFile(file);
      setOriginalImage(img);
      setOriginalPreviewUrl(img.src);

      // Auto-process with current settings
      await processImageWithSettings(img, settings);
    } catch (error) {
      console.error('Error loading image:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [settings, processImageWithSettings]);

  // Update settings and reprocess
  const updateSettings = useCallback(
    async (newSettings: Partial<EdgeDetectionSettings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);

      if (originalImage) {
        await processImageWithSettings(originalImage, updated);
      }
    },
    [settings, originalImage, processImageWithSettings]
  );

  // Clear all
  const clear = useCallback(() => {
    setOriginalImage(null);
    setOriginalPreviewUrl(null);
    setProcessedImageData(null);
    setPreviewUrl(null);
  }, []);

  return {
    originalImage,
    originalPreviewUrl,
    processedImageData,
    previewUrl,
    isProcessing,
    settings,
    loadImage,
    updateSettings,
    clear,
  };
}
