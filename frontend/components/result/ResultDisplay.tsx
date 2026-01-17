"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredResult, clearStoredResult } from "@/lib/utils";
import type { FeatureConfig } from "@/lib/types";
import { Button } from "@/components/ui";

interface ResultDisplayProps {
  config: FeatureConfig;
}

export function ResultDisplay({ config }: ResultDisplayProps) {
  const router = useRouter();
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    const stored = getStoredResult(config.storageKey);
    if (stored) {
      setContent(stored);
    } else {
      router.push(config.capturePath);
    }
  }, [config.storageKey, config.capturePath, router]);

  const handleRetry = () => {
    clearStoredResult(config.storageKey);
    router.push(config.capturePath);
  };

  const handleBackToMenu = () => {
    clearStoredResult(config.storageKey);
    router.push("/menu");
  };

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  const isRoast = config.type === "roast";
  const titleColor = isRoast ? "text-orange-500" : "text-white";

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-black p-8">
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-2xl text-center">
          <h1 className={`mb-8 text-2xl font-bold ${titleColor}`}>
            {config.title}
          </h1>
          <p className="whitespace-pre-line text-xl leading-relaxed text-white/90">
            {content}
          </p>
        </div>
      </div>

      <div className="flex w-full max-w-md flex-col gap-4">
        <Button
          onClick={handleRetry}
          variant={isRoast ? "accent" : "primary"}
          size="lg"
          fullWidth
        >
          {config.retryButtonText}
        </Button>
        <Button
          onClick={handleBackToMenu}
          variant="secondary"
          size="lg"
          fullWidth
        >
          Back to Menu
        </Button>
      </div>
    </div>
  );
}
