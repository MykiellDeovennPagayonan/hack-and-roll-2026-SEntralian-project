export interface CameraConfig {
  facingMode?: "user" | "environment";
  width?: number;
  height?: number;
}

const DEFAULT_CONFIG: CameraConfig = {
  facingMode: "environment",
  width: 1280,
  height: 720,
};

export async function startCameraStream(
  config: CameraConfig = {}
): Promise<MediaStream> {
  const { facingMode, width, height } = { ...DEFAULT_CONFIG, ...config };

  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode,
      width: { ideal: width },
      height: { ideal: height },
    },
  });
}

export function stopCameraStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

export function captureFrameAsBase64(
  video: HTMLVideoElement,
  quality: number = 0.8
): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  ctx.drawImage(video, 0, 0);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return dataUrl.split(",")[1];
}

export function getCameraErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    switch (error.name) {
      case "NotAllowedError":
        return "Camera permission denied. Please allow camera access.";
      case "NotFoundError":
        return "No camera found on this device.";
      default:
        return `Camera error: ${error.message}`;
    }
  }
  return "Failed to access camera.";
}
