"use client";

import { ResultDisplay } from "@/components/result";
import { FEATURE_CONFIGS } from "@/lib/types";

export default function RoastResult() {
  return <ResultDisplay config={FEATURE_CONFIGS.roast} />;
}
