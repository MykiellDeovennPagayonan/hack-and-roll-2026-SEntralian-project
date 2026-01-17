"use client";

import { forwardRef } from "react";
import type { CameraState } from "@/lib/types";

interface CameraViewProps {
  cameraState: CameraState;
}

export const CameraView = forwardRef<HTMLVideoElement, CameraViewProps>(
  ({ cameraState }, ref) => {
    const isVisible = cameraState === "ready" || cameraState === "capturing";

    return (
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        className={`h-full max-h-screen w-full object-cover ${
          isVisible ? "block" : "hidden"
        }`}
      />
    );
  }
);

CameraView.displayName = "CameraView";
