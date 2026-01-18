"use client";

import { useRouter } from "next/navigation";
import { useCamera } from "@/lib/hooks";
import { setStoredResult, setStoredImage } from "@/lib/utils";
import { generatePoemFromImage, generateRoastFromImage } from "@/lib/api";
import type { FeatureConfig } from "@/lib/types";

interface CameraCaptureProps {
  config: FeatureConfig;
}

export function CameraCapture({ config }: CameraCaptureProps) {
  const router = useRouter();
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
        setStoredImage(config.storageKey, base64);
        stopCamera();
        router.push(config.resultPath);
      }
    } catch (err) {
      console.error("Capture error:", err);
      setError(err instanceof Error ? err.message : "Failed to process image");
      clearCapturedImage();
      setCameraState("ready");
    }
  };

  const handleBack = () => {
    stopCamera();
    router.push("/menu");
  };

  const isRoast = config.type === "roast";
  const accentColor = isRoast ? "#ff0041" : "#00ff41";

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a] font-mono overflow-hidden">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,rgba(0,255,65,0.03)_0px,rgba(0,255,65,0.03)_1px,transparent_1px,transparent_2px)] opacity-40" />
      
      {/* Header with Back and Capture */}
      <header className={`border-b-2 ${isRoast ? 'border-[#ff0041]' : 'border-[#00ff41]'} bg-black/80 p-2 flex-shrink-0`}>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleBack}
            className={`inline-flex items-center gap-1 ${isRoast ? 'text-[#ff0041]' : 'text-[#00ff41]'} transition-opacity hover:opacity-70`}
          >
            <span className="text-lg">◄</span>
            <span className="text-xs tracking-wider">EXIT</span>
          </button>
          
          {(cameraState === "ready" || cameraState === "capturing") && (
            <button
              onClick={handleCapture}
              disabled={cameraState === "capturing"}
              style={{ borderColor: accentColor, color: accentColor }}
              className="flex-1 border-2 bg-black py-2 text-xs tracking-widest transition-all hover:text-black disabled:opacity-30 disabled:hover:bg-black"
              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = accentColor)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'black')}
            >
              {cameraState === "capturing" ? "● PROCESSING" : "● CAPTURE"}
            </button>
          )}
        </div>
      </header>

      {/* Camera View - takes remaining space */}
      <main className="relative flex-1 overflow-hidden">
        {cameraState === "loading" && (
          <div className={`absolute inset-0 flex items-center justify-center text-sm tracking-widest ${isRoast ? 'text-[#ff0041]' : 'text-[#00ff41]'}`}>
            CAMERA INIT...
          </div>
        )}

        {cameraState === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
            <div className="border-2 border-[#ff0041] bg-black p-4 text-center">
              <div className="mb-2 text-xs tracking-widest text-[#ff0041]">⚠ ERROR</div>
              <div className="text-xs text-[#ff0041]/80">{error}</div>
            </div>
            <button
              onClick={() => startCamera()}
              style={{ borderColor: accentColor, color: accentColor }}
              className="border-2 bg-black px-6 py-2 text-xs tracking-widest transition-all"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor, e.currentTarget.style.color = 'black')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'black', e.currentTarget.style.color = accentColor)}
            >
              RETRY
            </button>
          </div>
        )}

        {/* Camera/Captured Image Container */}
        <div className="relative h-full w-full">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${
                  cameraState === "ready" ? "block" : "hidden"
                }`}
              />
              {/* Color filter overlay for live camera only */}
              {cameraState === "ready" && (
                <div 
                  style={{ backgroundColor: accentColor }}
                  className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-20" 
                />
              )}
            </>
          )}

          {/* Loading Overlay */}
          {cameraState === "capturing" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div style={{ borderColor: accentColor, boxShadow: `0 0 30px ${accentColor}80` }} className="border-4 bg-black p-6">
                <div style={{ color: accentColor }} className="text-center text-sm tracking-widest">
                  <div className="mb-2 animate-pulse">█▓▒░</div>
                  {config.loadingText}
                </div>
              </div>
            </div>
          )}

          {/* Viewfinder Frame */}
          {cameraState === "ready" && !capturedImage && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
              <div 
                style={{ borderColor: accentColor, boxShadow: `0 0 20px ${accentColor}50` }}
                className="border-4 aspect-square w-full max-w-xs" 
              />
            </div>
          )}
        </div>

        {/* Error Toast */}
        {error && cameraState !== "error" && (
          <div className="absolute bottom-4 left-4 right-4 border-2 border-[#ff0041] bg-black p-3 text-xs text-[#ff0041]">
            ⚠ {error}
          </div>
        )}
      </main>
    </div>
  );
}