'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePrinter } from '@/lib/contexts';
import { useEdgeDetection } from '@/lib/hooks';

export default function PrintPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  const { isConnected, device, printImage, printAndCut } = usePrinter();
  const {
    originalPreviewUrl,
    processedImageData,
    previewUrl,
    isProcessing,
    settings,
    loadImage,
    updateSettings,
    clear,
  } = useEdgeDetection();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await loadImage(file);
      } catch (error) {
        console.error('Error loading image:', error);
      }
    }
  };

  const handlePrint = async () => {
    if (!processedImageData || !isConnected) return;

    setIsPrinting(true);
    setPrintError(null);

    try {
      await printImage(processedImageData);
      await printAndCut();
    } catch (error) {
      console.error('Print error:', error);
      setPrintError(error instanceof Error ? error.message : 'Failed to print');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link
          href="/printer"
          className="flex items-center gap-2 text-zinc-400 transition-colors hover:text-white"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back
        </Link>

        {/* Printer Status */}
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-zinc-400">
            {isConnected ? device?.name || 'Connected' : 'Not connected'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col p-4">
        {/* Upload Section */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-8 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          >
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-lg">
              {originalPreviewUrl ? 'Change Image' : 'Upload Image'}
            </span>
          </button>
        </div>

        {/* Image Previews */}
        {originalPreviewUrl && (
          <div className="mb-6 grid grid-cols-2 gap-4">
            {/* Original */}
            <div className="flex flex-col gap-2">
              <span className="text-sm text-zinc-500">Original</span>
              <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-900">
                <img
                  src={originalPreviewUrl}
                  alt="Original"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* Processed */}
            <div className="flex flex-col gap-2">
              <span className="text-sm text-zinc-500">Edge Detection</span>
              <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-900">
                {isProcessing ? (
                  <div className="flex h-full items-center justify-center">
                    <svg
                      className="h-8 w-8 animate-spin text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  </div>
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Processed"
                    className="h-full w-full object-contain"
                  />
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        {originalPreviewUrl && (
          <div className="mb-6 rounded-xl bg-zinc-900 p-4">
            <h3 className="mb-4 text-sm font-medium text-white">Settings</h3>

            {/* Algorithm Selection */}
            <div className="mb-4">
              <span className="mb-2 block text-xs text-zinc-500">Algorithm</span>
              <div className="flex gap-2">
                <button
                  onClick={() => updateSettings({ algorithm: 'sobel' })}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    settings.algorithm === 'sobel'
                      ? 'bg-white text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Sobel
                </button>
                <button
                  onClick={() => updateSettings({ algorithm: 'canny' })}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    settings.algorithm === 'canny'
                      ? 'bg-white text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Canny
                </button>
              </div>
            </div>

            {/* Threshold Sliders */}
            {settings.algorithm === 'sobel' ? (
              <div className="mb-4">
                <div className="mb-1 flex justify-between text-xs text-zinc-500">
                  <span>Threshold</span>
                  <span>{settings.sobelThreshold}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={settings.sobelThreshold}
                  onChange={(e) =>
                    updateSettings({ sobelThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-white"
                />
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-xs text-zinc-500">
                    <span>Low Threshold</span>
                    <span>{settings.cannyLowThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    value={settings.cannyLowThreshold}
                    onChange={(e) =>
                      updateSettings({ cannyLowThreshold: Number(e.target.value) })
                    }
                    className="w-full accent-white"
                  />
                </div>
                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-xs text-zinc-500">
                    <span>High Threshold</span>
                    <span>{settings.cannyHighThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={settings.cannyHighThreshold}
                    onChange={(e) =>
                      updateSettings({ cannyHighThreshold: Number(e.target.value) })
                    }
                    className="w-full accent-white"
                  />
                </div>
              </>
            )}

            {/* Invert Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Invert (for thermal printing)</span>
              <button
                onClick={() => updateSettings({ invert: !settings.invert })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.invert ? 'bg-white' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full transition-transform ${
                    settings.invert ? 'translate-x-5 bg-black' : 'bg-zinc-400'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {printError && (
          <div className="mb-4 rounded-xl bg-red-500/10 p-4 text-center text-sm text-red-400">
            {printError}
          </div>
        )}

        {/* Action Buttons */}
        {originalPreviewUrl && (
          <div className="mt-auto flex gap-4">
            <button
              onClick={clear}
              className="flex-1 rounded-xl bg-zinc-800 px-6 py-4 font-semibold text-white transition-colors hover:bg-zinc-700"
            >
              Clear
            </button>
            <button
              onClick={handlePrint}
              disabled={!isConnected || !processedImageData || isPrinting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPrinting ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Printing...
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print
                </>
              )}
            </button>
          </div>
        )}

        {/* Not Connected Warning */}
        {!isConnected && originalPreviewUrl && (
          <div className="mt-4 text-center">
            <Link
              href="/printer"
              className="text-sm text-zinc-500 underline hover:text-white"
            >
              Connect a printer to print
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
