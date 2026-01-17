'use client';

import Link from 'next/link';
import { useBluetoothPrinter } from '@/lib/hooks';

export default function PrinterPage() {
  const {
    isSupported,
    isConnected,
    isConnecting,
    device,
    error,
    connect,
    disconnect,
    clearError,
  } = useBluetoothPrinter();

  const handleConnect = async () => {
    try {
      await connect();
    } catch {
      // Error is handled in the hook
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link
          href="/"
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
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="flex w-full max-w-md flex-col items-center gap-8">
          {/* Printer Icon */}
          <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-white/5">
            <svg
              className={`h-16 w-16 transition-colors ${
                isConnected ? 'text-green-500' : 'text-zinc-500'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Printer Connection</h1>
            <p className="mt-2 text-zinc-400">
              Connect to your Bluetooth thermal printer
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 rounded-full bg-white/5 px-6 py-3">
            <div
              className={`h-3 w-3 rounded-full transition-colors ${
                isConnected
                  ? 'bg-green-500 shadow-lg shadow-green-500/50'
                  : isConnecting
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-zinc-600'
              }`}
            />
            <span className="text-sm text-zinc-300">
              {isConnecting
                ? 'Connecting...'
                : isConnected
                ? `Connected to ${device?.name || 'Printer'}`
                : 'Not connected'}
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex w-full items-center justify-between rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="ml-4 text-red-300 hover:text-red-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Browser Support Warning */}
          {isSupported === false && (
            <div className="w-full rounded-xl bg-yellow-500/10 px-4 py-3 text-center text-sm text-yellow-400">
              Web Bluetooth is not supported in this browser.
              <br />
              Please use Chrome, Edge, or a Chromium-based browser.
            </div>
          )}

          {/* Action Button */}
          <div className="w-full">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={isConnecting || isSupported === false}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-white font-semibold text-black transition-all hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isConnecting ? (
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
                    Searching for printers...
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
                        d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                      />
                    </svg>
                    Connect Printer
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-red-500/30 font-semibold text-red-400 transition-all hover:bg-red-500/10"
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
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                Disconnect
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 w-full rounded-xl bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-medium text-white">Instructions</h3>
            <ol className="space-y-2 text-sm text-zinc-400">
              <li className="flex gap-2">
                <span className="text-zinc-500">1.</span>
                Turn on your Bluetooth thermal printer
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-500">2.</span>
                Click "Connect Printer" above
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-500">3.</span>
                Select your printer from the list
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-500">4.</span>
                Wait for connection to complete
              </li>
            </ol>
          </div>

          {/* Supported Printers */}
          <div className="w-full text-center text-xs text-zinc-500">
            Supports X5/Cat printers, ESC/POS, PeriPage, and generic BLE printers
          </div>
        </div>
      </main>
    </div>
  );
}
