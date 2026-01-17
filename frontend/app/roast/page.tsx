"use client";

import { CameraCapture } from "@/components/camera";
import { FEATURE_CONFIGS } from "@/lib/types";

export default function RoastCamera() {
  return <CameraCapture config={FEATURE_CONFIGS.roast} />;
}