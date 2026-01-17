'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePrinter } from '@/lib/contexts';
import { useEffect } from 'react';

export default function PrinterPage() {
  const router = useRouter();
  const {
    isSupported,
    isConnected,
    isConnecting,
    device,
    error,
    connect,
    disconnect,
    clearError,
  } = usePrinter();

  // Navigate when connection succeeds
  useEffect(() => {
    if (isConnected) {
      router.push('/print');
    }
  }, [isConnected, router]);

  const handleConnect = async () => {
    try {
      await connect();
      // Navigation happens in useEffect
    } catch {
      // Error is handled in the context
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] font-mono">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,rgba(0,255,65,0.03)_0px,rgba(0,255,65,0.03)_1px,transparent_1px,transparent_2px)] opacity-40" />
      
      {/* Header */}
      <header className="border-b-2 border-[#00ff41] bg-black/80 p-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#00ff41] transition-opacity hover:opacity-70"
        >
          <span className="text-lg">◄</span>
          <span className="text-sm tracking-wider">EXIT</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Main Panel */}
          <div className="border-4 border-[#00ff41] bg-[#0a0a0a] p-1 shadow-[0_0_20px_rgba(0,255,65,0.3)]">
            {/* Title Bar */}
            <div className="border-2 border-[#00ff41] bg-black px-2 py-1">
              <div className="flex items-center justify-between text-xs tracking-widest text-[#00ff41]">
                <span>●PRINTER</span>
                <span className="animate-pulse">█▓▒░ 06</span>
              </div>
            </div>

            {/* Display Area */}
            <div className="mt-1 border-2 border-[#00ff41] bg-gradient-to-b from-[#001a0d] to-[#000a05] p-4">
              {/* Status Display */}
              <div className="mb-4 space-y-2 text-sm tracking-wide text-[#00ff41]">
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${isConnected ? 'animate-pulse' : ''}`}>
                    {isConnected ? '●' : '○'}
                  </span>
                  <span className="uppercase">
                    STATUS: {isConnecting ? 'SEARCHING...' : isConnected ? 'CONNECTED' : 'OFFLINE'}
                  </span>
                </div>
                
                {isConnected && device?.name && (
                  <div className="ml-6 text-xs opacity-80">
                    ► {device.name.toUpperCase()}
                  </div>
                )}
              </div>

              {/* ASCII Art Printer Icon */}
              <div className="my-4 text-center font-mono text-xs leading-tight text-[#00ff41] opacity-60">
                <pre className="inline-block">
{`┌─────────────┐
│ ███████████ │
│ ███████████ │
└─────────────┘
  │         │
  └─────────┘
  ▓▓▓▓▓▓▓▓▓▓▓
  ▓▓▓▓▓▓▓▓▓▓▓`}
                </pre>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 border border-[#ff0041] bg-black/50 p-2">
                  <div className="flex items-start justify-between gap-2 text-xs text-[#ff0041]">
                    <div>
                      <div className="mb-1 font-bold">⚠ ERROR</div>
                      <div className="opacity-80">{error.toUpperCase()}</div>
                    </div>
                    <button
                      onClick={clearError}
                      className="hover:opacity-70"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Browser Warning */}
              {isSupported === false && (
                <div className="mb-4 border border-[#ffff00] bg-black/50 p-2 text-xs text-[#ffff00]">
                  <div className="font-bold">⚠ INCOMPATIBLE</div>
                  <div className="mt-1 opacity-80">USE CHROMIUM BROWSER</div>
                </div>
              )}

              {/* System Info */}
              <div className="mb-4 border-t border-[#00ff41]/30 pt-3 text-xs tracking-wide text-[#00ff41]/60">
                <div>BLUETOOTH: {isSupported !== false ? 'READY' : 'UNAVAILABLE'}</div>
                <div>PROTOCOL: ESC/POS</div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="mt-1 space-y-1">
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || isSupported === false}
                  className="w-full border-2 border-[#00ff41] bg-black py-3 text-sm tracking-widest text-[#00ff41] transition-all hover:bg-[#00ff41] hover:text-black disabled:opacity-30 disabled:hover:bg-black disabled:hover:text-[#00ff41]"
                >
                  {isConnecting ? '► SEARCHING...' : '► CONNECT DEVICE'}
                </button>
              ) : (
                <button
                  onClick={disconnect}
                  className="w-full border-2 border-[#ff0041] bg-black py-3 text-sm tracking-widest text-[#ff0041] transition-all hover:bg-[#ff0041] hover:text-black"
                >
                  ✕ DISCONNECT
                </button>
              )}
            </div>

            {/* Footer Bar */}
            <div className="mt-1 border-2 border-[#00ff41] bg-black px-2 py-1 text-xs tracking-widest text-[#00ff41]/60">
              <div className="flex justify-between">
                <span>SELECT</span>
                <span>THERMAL PRINTER</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}