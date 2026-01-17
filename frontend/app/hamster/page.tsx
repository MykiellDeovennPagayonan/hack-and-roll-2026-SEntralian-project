"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCamera } from "@/lib/hooks";
import { matchHamsterImage } from "@/lib/api";
import { usePrinter } from "@/lib/contexts";
import { ImageProcessor } from "@/lib/utils";

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
  const [loadingMessage, setLoadingMessage] = useState("PROCESSING...");
  const [isPrinting, setIsPrinting] = useState(false);
  const userImageRef = useRef<string | null>(null);

  const { isConnected, isConnecting, connect, printImage, printAndCut } =
    usePrinter();

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

    // Store the captured image for printing
    userImageRef.current = base64;

    setCameraState("capturing");
    setError("");
    setIsLoading(true);

    try {
      setLoadingMessage("ANALYZING VIBE...");
      const response = await matchHamsterImage(base64);

      setResult({
        words: response.words,
        imageUrl: response.imageUrl,
        similarityScore: response.similarityScore,
      });
    } catch (err) {
      console.error("Match error:", err);
      setError(err instanceof Error ? err.message : "MATCH FAILED");
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
      // Connect if not connected, get characteristic for immediate use
      let char: BluetoothRemoteGATTCharacteristic | undefined;
      if (!isConnected) {
        char = await connect();
      }

      // Print user's photo with edge detection and "THIS IS YOU" label
      if (userImageRef.current) {
        // Print "THIS IS YOU" label
        const labelImageData = ImageProcessor.labelToImageData("THIS IS YOU", {
          fontSize: 24,
          paddingY: 20,
        });
        await printImage(labelImageData, char);

        // Print user's edge-detected photo
        const userImg = await ImageProcessor.loadImageFromBase64(
          userImageRef.current,
        );
        const userImageData = ImageProcessor.imageToImageData(userImg);
        const processedUser = ImageProcessor.processImageWithEdgeDetection(
          userImageData,
          "sobel",
          {
            sobelThreshold: 50,
            invert: true,
          },
        );
        await printImage(processedUser, char);
      }

      // Print the matched hamster image
      const hamsterUrl = `${API_BASE_URL}${result.imageUrl}`;
      const hamsterImg = await ImageProcessor.loadImage(hamsterUrl);
      const hamsterImageData = ImageProcessor.imageToImageData(hamsterImg);
      await printImage(hamsterImageData, char);

      // Feed paper
      await printAndCut(char);
    } catch (error) {
      console.error("Print error:", error);
    } finally {
      setIsPrinting(false);
    }
  };

  // Show result page
  if (result) {
    return (
      <div className="flex h-screen w-screen flex-col bg-[#0a0a0a] font-mono overflow-hidden">
        {/* Scanline overlay */}
        <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,rgba(0,255,65,0.03)_0px,rgba(0,255,65,0.03)_1px,transparent_1px,transparent_2px)] opacity-40" />

        {/* Compact Header */}
        <header className="border-b-2 border-[#00ff41] bg-black/80 px-2 py-1 flex-shrink-0">
          <div className="flex items-center justify-between text-[10px] tracking-widest text-[#00ff41]">
            <button onClick={handleBack} className="hover:opacity-70">
              ◄EXIT
            </button>
            <span>MATCH COMPLETE</span>
            {result.similarityScore && (
              <span>{Math.round(result.similarityScore * 100)}%</span>
            )}
          </div>
        </header>

        <main className="flex flex-1 overflow-hidden">
          {/* Left Panel - Image */}
          <div className="w-[45%] border-r-2 border-[#00ff41] bg-gradient-to-b from-[#001a0d] to-[#000a05] p-2 flex flex-col">
            <div className="border-2 border-[#00ff41] flex-1 flex items-center justify-center overflow-hidden">
              <img
                src={`${API_BASE_URL}${result.imageUrl}`}
                alt="Match"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-1 text-center text-[9px] tracking-widest text-[#00ff41]/60">
              IMAGE #{String(Math.floor(Math.random() * 9999)).padStart(4, "0")}
            </div>
          </div>

          {/* Right Panel - Data & Controls */}
          <div className="flex-1 flex flex-col bg-gradient-to-b from-[#001a0d] to-[#000a05]">
            {/* Attributes Section */}
            <div className="flex-1 overflow-y-auto p-2">
              <div className="text-[9px] tracking-widest text-[#00ff41]/60 mb-1">
                ►ATTRIBUTES:
              </div>
              <div className="space-y-[2px]">
                {result.words.map((word, index) => (
                  <div
                    key={index}
                    className="border border-[#00ff41] bg-black px-1 py-[2px] text-[10px] tracking-wide text-[#00ff41]"
                  >
                    {word.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            {/* Control Panel */}
            <div className="border-t-2 border-[#00ff41] bg-black p-2 space-y-1 flex-shrink-0">
              <button
                onClick={handlePrint}
                disabled={isPrinting || isConnecting}
                className="w-full border-2 border-[#ffff00] bg-black py-2 text-[10px] tracking-widest text-[#ffff00] transition-all hover:bg-[#ffff00] hover:text-black disabled:opacity-30 disabled:hover:bg-black disabled:hover:text-[#ffff00]"
              >
                {isPrinting
                  ? "●PRINT..."
                  : isConnecting
                    ? "●CONN..."
                    : "►PRINT"}
              </button>
              <button
                onClick={handleRetry}
                className="w-full border-2 border-[#00ff41] bg-black py-2 text-[10px] tracking-widest text-[#00ff41] transition-all hover:bg-[#00ff41] hover:text-black"
              >
                ►RESCAN
              </button>
            </div>

            {/* Footer Status */}
            <div className="border-t-2 border-[#00ff41] bg-black px-2 py-[2px] text-[8px] tracking-widest text-[#00ff41]/60 text-center flex-shrink-0">
              HAMSTER.DB v1.0
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Camera capture page
  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a] font-mono overflow-hidden">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,rgba(0,255,65,0.03)_0px,rgba(0,255,65,0.03)_1px,transparent_1px,transparent_2px)] opacity-40" />

      {/* Header with Back and Capture */}
      <header className="border-b-2 border-[#00ff41] bg-black/80 p-2 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-[#00ff41] transition-opacity hover:opacity-70"
          >
            <span className="text-lg">◄</span>
            <span className="text-xs tracking-wider">EXIT</span>
          </button>

          {(cameraState === "ready" || cameraState === "capturing") && (
            <button
              onClick={handleCapture}
              disabled={cameraState === "capturing" || isLoading}
              className="flex-1 border-2 border-[#00ff41] bg-black py-2 text-xs tracking-widest text-[#00ff41] transition-all hover:bg-[#00ff41] hover:text-black disabled:opacity-30 disabled:hover:bg-black disabled:hover:text-[#00ff41]"
            >
              {cameraState === "capturing" ? "● PROCESSING" : "● CAPTURE"}
            </button>
          )}
        </div>
      </header>

      {/* Camera View - takes remaining space */}
      <main className="relative flex-1 overflow-hidden">
        {cameraState === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-sm tracking-widest text-[#00ff41]">
            CAMERA INIT...
          </div>
        )}

        {cameraState === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
            <div className="border-2 border-[#ff0041] bg-black p-4 text-center">
              <div className="mb-2 text-xs tracking-widest text-[#ff0041]">
                ⚠ ERROR
              </div>
              <div className="text-xs text-[#ff0041]/80">{error}</div>
            </div>
            <button
              onClick={startCamera}
              className="border-2 border-[#00ff41] bg-black px-6 py-2 text-xs tracking-widest text-[#00ff41] hover:bg-[#00ff41] hover:text-black"
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
              {/* Green filter overlay for live camera only */}
              {cameraState === "ready" && (
                <div className="pointer-events-none absolute inset-0 bg-[#00ff41] mix-blend-multiply opacity-20" />
              )}
            </>
          )}

          {/* Loading Overlay */}
          {(cameraState === "capturing" || isLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="border-4 border-[#00ff41] bg-black p-6 shadow-[0_0_30px_rgba(0,255,65,0.5)]">
                <div className="text-center text-sm tracking-widest text-[#00ff41]">
                  <div className="mb-2 animate-pulse">█▓▒░</div>
                  {loadingMessage}
                </div>
              </div>
            </div>
          )}

          {/* Viewfinder Frame */}
          {cameraState === "ready" && !capturedImage && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
              <div className="border-4 border-[#00ff41] aspect-square w-full max-w-xs shadow-[0_0_20px_rgba(0,255,65,0.3)]" />
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
