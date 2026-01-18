"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCamera } from "@/lib/hooks";
import { generateRoastFromImage } from "@/lib/api";
import { usePrinter } from "@/lib/contexts";
import { PrintService } from "@/lib/services";

export default function RoastPage() {
  const router = useRouter();
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const userImageRef = useRef<string | null>(null);

  const { isConnected, isConnecting, connect, printImage, printAndCut } =
    usePrinter();

  const {
    videoRef,
    cameraState,
    error,
    capturedImage,
    cameras,
    selectedCameraId,
    startCamera,
    stopCamera,
    capturePhoto,
    clearCapturedImage,
    setError,
    setCameraState,
    switchCamera,
  } = useCamera({ preferExternalCamera: true });

  const handleCapture = async () => {
    const base64 = capturePhoto();
    if (!base64) return;

    userImageRef.current = base64;
    setCameraState("capturing");
    setError("");
    setIsLoading(true);

    try {
      const response = await generateRoastFromImage(base64);

      if (response.success && response.roast) {
        setResult(response.roast);
      } else {
        throw new Error(response.error || "Failed to generate roast");
      }
    } catch (err) {
      console.error("Roast error:", err);
      setError(err instanceof Error ? err.message : "ROAST FAILED");
      clearCapturedImage();
      setCameraState("ready");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    userImageRef.current = null;
    clearCapturedImage();
    setCameraState("ready");
    startCamera();
  };

  const handleBack = () => {
    stopCamera();
    router.push("/menu");
  };

  const handlePrint = async () => {
    if (!result) return;

    setIsPrinting(true);
    try {
      let char: BluetoothRemoteGATTCharacteristic | undefined;
      if (!isConnected) {
        char = await connect();
      }

      // Print user's photo with edge detection
      if (userImageRef.current) {
        const userImageData = await PrintService.processImageForPrint(
          userImageRef.current
        );
        await printImage(userImageData, char);
      }

      // Print the roast text
      const textImageData = PrintService.createTextImage(result, {
        fontSize: 24,
        lineHeight: 1.4,
        padding: 20,
      });
      await printImage(textImageData, char);

      await printAndCut(char);
    } catch (error) {
      console.error("Print error:", error);
    } finally {
      setIsPrinting(false);
    }
  };

  // Result view
  if (result) {
    return (
      <div className="flex h-screen w-screen flex-col bg-[#0a0a0a] font-mono overflow-hidden">
        {/* Scanline overlay */}
        <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,rgba(255,0,65,0.03)_0px,rgba(255,0,65,0.03)_1px,transparent_1px,transparent_2px)] opacity-40" />

        {/* Header */}
        <header className="border-b-2 border-[#ff0041] bg-black/80 px-2 md:px-6 py-1 md:py-3 flex-shrink-0">
          <div className="flex items-center justify-between text-[10px] md:text-base lg:text-lg tracking-widest text-[#ff0041]">
            <button onClick={handleBack} className="hover:opacity-70">
              ◄EXIT
            </button>
            <span>YOU GOT ROASTED</span>
            <span className="animate-pulse">🔥</span>
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Roast Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gradient-to-b from-[#1a0a0d] to-[#0a0005]">
            <div className="border-2 border-[#ff0041] bg-black p-4 md:p-6 lg:p-8">
              <div className="text-[#ff0041] text-sm md:text-lg lg:text-xl leading-relaxed whitespace-pre-line">
                {result}
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="border-t-2 border-[#ff0041] bg-black p-2 md:p-6 space-y-1 md:space-y-3 flex-shrink-0">
            <button
              onClick={handlePrint}
              disabled={isPrinting || isConnecting}
              className="w-full border-2 border-[#ffff00] bg-black py-2 md:py-4 text-[10px] md:text-base tracking-widest text-[#ffff00] transition-all hover:bg-[#ffff00] hover:text-black disabled:opacity-30"
            >
              {isPrinting ? "●PRINTING..." : isConnecting ? "●CONNECTING..." : "►PRINT"}
            </button>
            <button
              onClick={handleRetry}
              className="w-full border-2 border-[#ff0041] bg-black py-2 md:py-4 text-[10px] md:text-base tracking-widest text-[#ff0041] transition-all hover:bg-[#ff0041] hover:text-black"
            >
              ►ROAST AGAIN
            </button>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-[#ff0041] bg-black px-2 py-1 text-[8px] md:text-xs tracking-widest text-[#ff0041]/60 text-center">
            ROAST.AI v1.0
          </div>
        </main>
      </div>
    );
  }

  // Camera view
  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a] font-mono overflow-hidden">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,rgba(255,0,65,0.03)_0px,rgba(255,0,65,0.03)_1px,transparent_1px,transparent_2px)] opacity-40" />

      {/* Header */}
      <header className="border-b-2 border-[#ff0041] bg-black/80 p-2 md:p-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-[#ff0041] transition-opacity hover:opacity-70"
          >
            <span className="text-lg md:text-2xl">◄</span>
            <span className="text-xs md:text-base tracking-wider">EXIT</span>
          </button>

          {/* Camera Selector */}
          {cameras.length > 1 && cameraState === "ready" && (
            <select
              value={selectedCameraId || ''}
              onChange={(e) => switchCamera(e.target.value)}
              className="border border-[#ff0041] bg-black text-[#ff0041] px-2 py-1 text-xs md:text-sm tracking-wider"
            >
              {cameras.map((camera, idx) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          )}

          {(cameraState === "ready" || cameraState === "capturing") && (
            <button
              onClick={handleCapture}
              disabled={cameraState === "capturing" || isLoading}
              className="flex-1 border-2 border-[#ff0041] bg-black py-2 md:py-4 text-xs md:text-base tracking-widest text-[#ff0041] transition-all hover:bg-[#ff0041] hover:text-black disabled:opacity-30"
            >
              {cameraState === "capturing" ? "● ROASTING..." : "● CAPTURE"}
            </button>
          )}
        </div>
      </header>

      {/* Camera View */}
      <main className="relative flex-1 overflow-hidden">
        {cameraState === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-sm md:text-xl tracking-widest text-[#ff0041]">
            CAMERA INIT...
          </div>
        )}

        {cameraState === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
            <div className="border-2 border-[#ff0041] bg-black p-4 md:p-6 text-center">
              <div className="mb-2 text-xs md:text-base tracking-widest text-[#ff0041]">
                ⚠ ERROR
              </div>
              <div className="text-xs md:text-base text-[#ff0041]/80">{error}</div>
            </div>
            <button
              onClick={() => startCamera()}
              className="border-2 border-[#ff0041] bg-black px-6 md:px-10 py-2 md:py-4 text-xs md:text-base tracking-widest text-[#ff0041] hover:bg-[#ff0041] hover:text-black"
            >
              RETRY
            </button>
          </div>
        )}

        {/* Camera/Captured Image */}
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
              {cameraState === "ready" && (
                <div className="pointer-events-none absolute inset-0 bg-[#ff0041] mix-blend-multiply opacity-20" />
              )}
            </>
          )}

          {/* Loading Overlay */}
          {(cameraState === "capturing" || isLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="border-4 border-[#ff0041] bg-black p-6 md:p-10 shadow-[0_0_30px_rgba(255,0,65,0.5)]">
                <div className="text-center text-sm md:text-xl tracking-widest text-[#ff0041]">
                  <div className="mb-2 animate-pulse">🔥🔥🔥</div>
                  GENERATING ROAST...
                </div>
              </div>
            </div>
          )}

          {/* Viewfinder */}
          {cameraState === "ready" && !capturedImage && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
              <div className="border-4 border-[#ff0041] aspect-square w-full max-w-xs md:max-w-md shadow-[0_0_20px_rgba(255,0,65,0.3)]" />
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
