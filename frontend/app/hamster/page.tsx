"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCamera } from "@/lib/hooks";
import { matchHamsterImage } from "@/lib/api";
import { BackButton, LoadingOverlay, ErrorMessage } from "@/components/ui";
import { CameraView } from "@/components/camera/CameraView";
import { CaptureButton } from "@/components/camera/CaptureButton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface MatchResult {
  words: string[];
  imageUrl: string;
  similarityScore?: number;
}

export default function HamsterPage() {
  const router = useRouter();
  const [result, setResult] = useState<MatchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Processing...");

  const {
    videoRef,
    cameraState,
    error,
    capturedImage,
    startCamera,
    stopCamera,
    capturePhoto,
    clearCapturedImage,
    setError,
    setCameraState,
  } = useCamera();

  const handleCapture = async () => {
    const base64 = capturePhoto();
    if (!base64) return;

    setCameraState("capturing");
    setError("");
    setIsLoading(true);

    try {
      // Step 1: Extract words from image
      setLoadingMessage("Analyzing your vibe...");

      // Step 2: Match to hamster library (this does both steps internally)
      const response = await matchHamsterImage(base64);

      setResult({
        words: response.words,
        imageUrl: response.imageUrl,
        similarityScore: response.similarityScore,
      });
    } catch (err) {
      console.error("Match error:", err);
      setError(err instanceof Error ? err.message : "Failed to match image");
      clearCapturedImage();
      setCameraState("ready");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    clearCapturedImage();
    setCameraState("ready");
  };

  const handleBack = () => {
    stopCamera();
    router.push("/menu");
  };

  // Show result page
  if (result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-8">
        <BackButton onClick={handleBack} />

        <div className="flex flex-col items-center gap-8">
          {/* Title */}
          <h1 className="text-3xl font-bold text-white">What Hamster Are You?</h1>

          {/* Matched Image */}
          <div className="relative overflow-hidden rounded-2xl border-4 border-white/20">
            <img
              src={`${API_BASE_URL}${result.imageUrl}`}
              alt="Matched hamster"
              className="h-64 w-64 object-cover"
            />
          </div>

          {/* Three Words */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg text-zinc-400">You are...</p>
            <div className="flex flex-wrap justify-center gap-3">
              {result.words.map((word, index) => (
                <span
                  key={index}
                  className="rounded-full bg-white/10 px-6 py-3 text-xl font-semibold text-white"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          {/* Retry Button */}
          <button
            onClick={handleRetry}
            className="mt-4 rounded-xl bg-white px-8 py-4 text-lg font-bold text-black transition-all hover:bg-zinc-200 hover:scale-105 active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Camera capture page
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

        <CameraView
          ref={videoRef}
          cameraState={cameraState}
          capturedImage={capturedImage}
        />

        {(cameraState === "capturing" || isLoading) && (
          <LoadingOverlay message={loadingMessage} />
        )}
      </div>

      {(cameraState === "ready" || cameraState === "capturing") && (
        <CaptureButton
          onClick={handleCapture}
          disabled={cameraState === "capturing" || isLoading}
          accentColor="white"
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
