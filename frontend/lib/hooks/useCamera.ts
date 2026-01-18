"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { CameraState } from "../types";
import {
  stopCameraStream,
  captureFrameAsBase64,
  getCameraErrorMessage,
} from "../utils/camera";

interface UseCameraOptions {
  autoStart?: boolean;
  preferExternalCamera?: boolean;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraState: CameraState;
  error: string;
  capturedImage: string | null;
  cameras: MediaDeviceInfo[];
  selectedCameraId: string | null;
  startCamera: (deviceId?: string) => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => string | null;
  clearCapturedImage: () => void;
  setError: (error: string) => void;
  setCameraState: (state: CameraState) => void;
  switchCamera: (deviceId: string) => Promise<void>;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { autoStart = true, preferExternalCamera = true } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef<boolean>(true);
  const [cameraState, setCameraState] = useState<CameraState>("loading");
  const [error, setError] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  // Get list of available cameras
  const getCameras = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    try {
      // Need to request permission first to get camera labels
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      stopCameraStream(tempStream);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      return videoDevices;
    } catch (err) {
      console.error("Failed to enumerate cameras:", err);
      return [];
    }
  }, []);

  // Find preferred camera (external over built-in)
  const findPreferredCamera = useCallback((deviceList: MediaDeviceInfo[]): string | undefined => {
    if (deviceList.length === 0) return undefined;
    if (deviceList.length === 1) return deviceList[0].deviceId;

    if (preferExternalCamera) {
      // Look for external camera (usually doesn't have "built-in" or "integrated" in the label)
      const externalCamera = deviceList.find(device => {
        const label = device.label.toLowerCase();
        return !label.includes('built-in') &&
               !label.includes('integrated') &&
               !label.includes('facetime') &&
               !label.includes('isight');
      });
      if (externalCamera) return externalCamera.deviceId;
    }

    // Default to first camera
    return deviceList[0].deviceId;
  }, [preferExternalCamera]);

  const stopCamera = useCallback(() => {
    stopCameraStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      setCameraState("loading");
      setError("");

      // Stop any existing stream first
      stopCameraStream(streamRef.current);
      streamRef.current = null;

      // Get cameras if we haven't yet
      let cameraList = cameras;
      if (cameraList.length === 0) {
        cameraList = await getCameras();
      }

      // Determine which camera to use
      const targetDeviceId = deviceId || findPreferredCamera(cameraList);

      // Build constraints
      const constraints: MediaStreamConstraints = {
        video: targetDeviceId
          ? { deviceId: { exact: targetDeviceId } }
          : { facingMode: 'user' }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Check if component is still mounted before updating state
      if (!mountedRef.current) {
        stopCameraStream(stream);
        return;
      }

      streamRef.current = stream;

      // Get the actual device ID being used
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      if (settings.deviceId) {
        setSelectedCameraId(settings.deviceId);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          if (mountedRef.current) {
            setCameraState("ready");
          }
        } catch (playError) {
          if (playError instanceof Error && playError.name === "AbortError") {
            console.debug("Camera play() was interrupted - this is expected during cleanup");
            return;
          }
          throw playError;
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error("Camera error:", err);
        setError(getCameraErrorMessage(err));
        setCameraState("error");
      }
    }
  }, [cameras, getCameras, findPreferredCamera]);

  const switchCamera = useCallback(async (deviceId: string) => {
    stopCamera();
    await startCamera(deviceId);
  }, [stopCamera, startCamera]);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || cameraState !== "ready") {
      return null;
    }

    try {
      const base64 = captureFrameAsBase64(videoRef.current);
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
      stopCameraStream(streamRef.current);
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [autoStart]);

  return {
    videoRef,
    cameraState,
    error,
    capturedImage,
    cameras,
    selectedCameraId,
    startCamera,
    stopCamera,
    capturePhoto,
    clearCapturedImage,
    setError,
    setCameraState,
    switchCamera,
  };
}
