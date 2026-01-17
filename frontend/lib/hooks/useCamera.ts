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
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => string | null;
  setError: (error: string) => void;
  setCameraState: (state: CameraState) => void;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { autoStart = true, ...cameraConfig } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("loading");
  const [error, setError] = useState<string>("");

  const stopCamera = useCallback(() => {
    stopCameraStream(streamRef.current);
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraState("loading");
      setError("");

      const stream = await startCameraStream(cameraConfig);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraState("ready");
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError(getCameraErrorMessage(err));
      setCameraState("error");
    }
  }, [cameraConfig]);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || cameraState !== "ready") {
      return null;
    }

    try {
      return captureFrameAsBase64(videoRef.current);
    } catch (err) {
      console.error("Capture error:", err);
      setError(err instanceof Error ? err.message : "Failed to capture photo");
      return null;
    }
  }, [cameraState]);

  useEffect(() => {
    if (autoStart) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  return {
    videoRef,
    cameraState,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    setError,
    setCameraState,
  };
}
