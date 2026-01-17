"use client";

import { useRouter } from "next/navigation";
import { useCamera } from "@/lib/hooks";
import { setStoredResult } from "@/lib/utils";
import { generatePoemFromImage, generateRoastFromImage } from "@/lib/api";
import type { FeatureConfig } from "@/lib/types";
import { BackButton, LoadingOverlay, ErrorMessage } from "@/components/ui";
import { CameraView } from "./CameraView";
import { CaptureButton } from "./CaptureButton";

interface CameraCaptureProps {
  config: FeatureConfig;
}

export function CameraCapture({ config }: CameraCaptureProps) {
  const router = useRouter();
  const {
    videoRef,
    cameraState,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    setError,
    setCameraState,
  } = useCamera();

  const handleCapture = async () => {
    const base64 = capturePhoto();
    if (!base64) return;

    setCameraState("capturing");
    setError("");

    try {
      let result: string | undefined;

      if (config.type === "poem") {
        const response = await generatePoemFromImage(base64);
        if (response.success && response.poem) {
          result = response.poem;
        } else {
          throw new Error(response.error || "Failed to generate poem");
        }
      } else {
        const response = await generateRoastFromImage(base64);
        if (response.success && response.roast) {
          result = response.roast;
        } else {
          throw new Error(response.error || "Failed to generate roast");
        }
      }

      if (result) {
        setStoredResult(config.storageKey, result);
        stopCamera();
        router.push(config.resultPath);
      }
    } catch (err) {
      console.error("Capture error:", err);
      setError(err instanceof Error ? err.message : "Failed to process image");
      setCameraState("ready");
    }
  };

  const handleBack = () => {
    stopCamera();
  };

  const accentColor = config.type === "roast" ? "orange" : "white";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-black">
      <BackButton onClick={handleBack} />

      <div className="relative flex h-full w-full flex-1 items-center justify-center">
        {cameraState === "loading" && (
          <div className="text-xl text-white">Starting camera...</div>
        )}

        {cameraState === "error" && (
          <ErrorMessage message={error} onRetry={startCamera} />
        )}

        <CameraView ref={videoRef} cameraState={cameraState} />

        {cameraState === "capturing" && (
          <LoadingOverlay message={config.loadingText} />
        )}
      </div>

      {(cameraState === "ready" || cameraState === "capturing") && (
        <CaptureButton
          onClick={handleCapture}
          disabled={cameraState === "capturing"}
          accentColor={accentColor}
        />
      )}

      {error && cameraState !== "error" && (
        <div className="absolute bottom-32 left-4 right-4 rounded-lg bg-red-500/90 p-4 text-center text-white">
          {error}
        </div>
      )}
    </div>
  );
}
