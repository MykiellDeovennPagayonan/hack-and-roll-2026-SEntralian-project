"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredResult, clearStoredResult, getStoredImage, clearStoredImage, ImageProcessor } from "@/lib/utils";
import { usePrinter } from "@/lib/contexts";
import type { FeatureConfig } from "@/lib/types";

interface ResultDisplayProps {
  config: FeatureConfig;
}

export function ResultDisplay({ config }: ResultDisplayProps) {
  const router = useRouter();
  const [content, setContent] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const { isConnected, isConnecting, connect, printImage, printAndCut } = usePrinter();

  useEffect(() => {
    const stored = getStoredResult(config.storageKey);
    const storedImage = getStoredImage(config.storageKey);
    if (stored) {
      setContent(stored);
      setCapturedImage(storedImage);
    } else {
      router.push(config.capturePath);
    }
  }, [config.storageKey, config.capturePath, router]);

  const handleRetry = () => {
    clearStoredResult(config.storageKey);
    clearStoredImage(config.storageKey);
    router.push(config.capturePath);
  };

  const handleBackToMenu = () => {
    clearStoredResult(config.storageKey);
    clearStoredImage(config.storageKey);
    router.push("/menu");
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      // Connect if not connected, get characteristic for immediate use
      let char: BluetoothRemoteGATTCharacteristic | undefined;
      if (!isConnected) {
        char = await connect();
      }

      // Print captured image with edge detection if available
      if (capturedImage) {
        const img = await ImageProcessor.loadImageFromBase64(capturedImage);
        const imageData = ImageProcessor.imageToImageData(img);
        const processed = ImageProcessor.processImageWithEdgeDetection(imageData, 'sobel', {
          sobelThreshold: 50,
          invert: true,
        });
        await printImage(processed, char);
      }

      // Print the text content
      const textImageData = ImageProcessor.textToImageData(content, {
        fontSize: 24,
        lineHeight: 1.4,
        padding: 20,
      });
      await printImage(textImageData, char);

      // Feed paper
      await printAndCut(char);
    } catch (error) {
      console.error("Print error:", error);
    } finally {
      setIsPrinting(false);
    }
  };

  if (!content) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0a0a0a] font-mono">
        <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,rgba(0,255,65,0.03)_0px,rgba(0,255,65,0.03)_1px,transparent_1px,transparent_2px)] opacity-40" />
        <div className="flex flex-1 items-center justify-center text-sm tracking-widest text-[#00ff41]">
          LOADING...
        </div>
      </div>
    );
  }

  const isRoast = config.type === "roast";
  const accentColor = isRoast ? "#ff0041" : "#00ff41";

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] font-mono">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,rgba(0,255,65,0.03)_0px,rgba(0,255,65,0.03)_1px,transparent_1px,transparent_2px)] opacity-40" />

      {/* Header */}
      <header style={{ borderColor: accentColor }} className="border-b-2 bg-black/80 p-2">
        <div style={{ color: accentColor }} className="flex items-center justify-between text-xs tracking-widest">
          <span>●{config.title.toUpperCase()}</span>
          <span className="animate-pulse">█▓▒░</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Main Panel */}
          <div style={{ borderColor: accentColor, boxShadow: `0 0 20px ${accentColor}50` }} className="border-4 bg-[#0a0a0a] p-1">
            {/* Title Bar */}
            <div style={{ borderColor: accentColor }} className="border-2 bg-black px-2 py-1">
              <div style={{ color: accentColor }} className="text-center text-sm tracking-widest">
                OUTPUT
              </div>
            </div>

            {/* Display Area */}
            <div style={{ borderColor: accentColor }} className="mt-1 border-2 bg-gradient-to-b from-[#001a0d] to-[#000a05] p-4">
              <div style={{ color: accentColor }} className="whitespace-pre-line text-sm leading-relaxed font-mono">
                {content}
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-1 space-y-1">
              {/* Print Button */}
              <button
                onClick={handlePrint}
                disabled={isPrinting || isConnecting}
                style={{ borderColor: "#ffff00", color: "#ffff00" }}
                className="w-full border-2 bg-black py-3 text-sm tracking-widest transition-all disabled:opacity-30"
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = "#ffff00", e.currentTarget.style.color = 'black')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'black', e.currentTarget.style.color = "#ffff00")}
              >
                {isPrinting ? "● PRINTING..." : isConnecting ? "● CONNECTING..." : "► PRINT"}
              </button>

              <button
                onClick={handleRetry}
                style={{ borderColor: accentColor, color: accentColor }}
                className="w-full border-2 bg-black py-3 text-sm tracking-widest transition-all"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor, e.currentTarget.style.color = 'black')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'black', e.currentTarget.style.color = accentColor)}
              >
                ► {config.retryButtonText.toUpperCase()}
              </button>

              <button
                onClick={handleBackToMenu}
                className="w-full border-2 border-[#00ff41] bg-black py-3 text-sm tracking-widest text-[#00ff41] transition-all hover:bg-[#00ff41] hover:text-black"
              >
                ◄ MAIN MENU
              </button>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
