"use client";

import { forwardRef } from "react";
import type { CameraState } from "@/lib/types";

interface CameraViewProps {
  cameraState: CameraState;
  capturedImage?: string | null;
}

export const CameraView = forwardRef<HTMLVideoElement, CameraViewProps>(
  ({ cameraState, capturedImage }, ref) => {
    const isVisible = cameraState === "ready" || cameraState === "capturing";
    const showFrozenImage = capturedImage && cameraState === "capturing";

    return (
      <>
        {showFrozenImage && (
          <img
            src={capturedImage}
            alt="Captured"
            className="h-full max-h-screen w-full object-cover"
          />
        )}
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className={`h-full max-h-screen w-full object-cover ${
            isVisible && !showFrozenImage ? "block" : "hidden"
          }`}
        />
      </>
    );
  }
);

CameraView.displayName = "CameraView";
