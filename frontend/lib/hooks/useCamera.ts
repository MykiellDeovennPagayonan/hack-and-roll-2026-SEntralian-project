"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { CameraState } from "../types";
import {
  startCameraStream,
  stopCameraStream,
  captureFrameAsBase64,
  getCameraErrorMessage,
  type CameraConfig,
} from "../utils/camera";

interface UseCameraOptions extends CameraConfig {
  autoStart?: boolean;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraState: CameraState;
  error: string;
  capturedImage: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => string | null;
  clearCapturedImage: () => void;
  setError: (error: string) => void;
  setCameraState: (state: CameraState) => void;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { autoStart = true, facingMode, width, height } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef<boolean>(true);
  const [cameraState, setCameraState] = useState<CameraState>("loading");
  const [error, setError] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    stopCameraStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraState("loading");
      setError("");

      // Stop any existing stream first
      stopCamera();

      const cameraConfig: CameraConfig = { facingMode, width, height };
      const stream = await startCameraStream(cameraConfig);

      // Check if component is still mounted before updating state
      if (!mountedRef.current) {
        stopCameraStream(stream);
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          // Double-check mounted state after async play()
          if (mountedRef.current) {
            setCameraState("ready");
          }
        } catch (playError) {
          // AbortError is expected when play() is interrupted by cleanup
          // This happens in React Strict Mode or when component re-renders
          if (playError instanceof Error && playError.name === "AbortError") {
            console.debug("Camera play() was interrupted - this is expected during cleanup");
            return;
          }
          throw playError;
        }
      }
    } catch (err) {
      // Only set error state if still mounted and not an abort
      if (mountedRef.current) {
        console.error("Camera error:", err);
        setError(getCameraErrorMessage(err));
        setCameraState("error");
      }
    }
  }, [facingMode, width, height, stopCamera]);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || cameraState !== "ready") {
      return null;
    }

    try {
      const base64 = captureFrameAsBase64(videoRef.current);
      // Store the full data URL for displaying the frozen image
      setCapturedImage(`data:image/jpeg;base64,${base64}`);
      return base64;
    } catch (err) {
      console.error("Capture error:", err);
      setError(err instanceof Error ? err.message : "Failed to capture photo");
      return null;
    }
  }, [cameraState]);

  const clearCapturedImage = useCallback(() => {
    setCapturedImage(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (autoStart) {
      startCamera();
    }

    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  return {
    videoRef,
    cameraState,
    error,
    capturedImage,
    startCamera,
    stopCamera,
    capturePhoto,
    clearCapturedImage,
    setError,
    setCameraState,
  };
}
