"use client";

import { CameraCapture } from "@/components/camera";
import { FEATURE_CONFIGS } from "@/lib/types";

export default function PoemCamera() {
  return <CameraCapture config={FEATURE_CONFIGS.poem} />;
}
