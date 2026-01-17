"use client";

import { useRouter } from "next/navigation";

export default function Menu() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] font-mono">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,rgba(0,255,65,0.03)_0px,rgba(0,255,65,0.03)_1px,transparent_1px,transparent_2px)] opacity-40" />
      
      {/* Header */}
      <header className="border-b-2 border-[#00ff41] bg-black/80 p-2">
        <div className="flex items-center justify-between text-xs tracking-widest text-[#00ff41]">
          <span>●MAIN MENU</span>
          <span className="animate-pulse">█▓▒░ 01</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Main Panel */}
          <div className="border-4 border-[#00ff41] bg-[#0a0a0a] p-1 shadow-[0_0_20px_rgba(0,255,65,0.3)]">
            {/* Title Bar */}
            <div className="border-2 border-[#00ff41] bg-black px-2 py-1">
              <div className="text-center text-sm tracking-widest text-[#00ff41]">
                SELECT OPERATION
              </div>
            </div>

            {/* Menu Items */}
            <div className="mt-1 space-y-1">
              <button
                onClick={() => router.push("/hamster")}
                className="w-full border-2 border-[#00ff41] bg-black py-4 text-left px-4 text-sm tracking-widest text-[#00ff41] transition-all hover:bg-[#00ff41] hover:text-black"
              >
                <div className="flex items-center justify-between">
                  <span>► HAMSTER ANALYSIS</span>
                  <span className="text-xs opacity-60">[01]</span>
                </div>
              </button>

              <button
                onClick={() => router.push("/roast")}
                className="w-full border-2 border-[#ff0041] bg-black py-4 text-left px-4 text-sm tracking-widest text-[#ff0041] transition-all hover:bg-[#ff0041] hover:text-black"
              >
                <div className="flex items-center justify-between">
                  <span>► ROAST MODE</span>
                  <span className="text-xs opacity-60">[02]</span>
                </div>
              </button>
            </div>

            {/* Footer Bar */}
            <div className="mt-1 border-2 border-[#00ff41] bg-black px-2 py-1 text-xs tracking-widest text-[#00ff41]/60">
              <div className="flex justify-between">
                <span>SYSTEM READY</span>
                <span>2 MODES AVAILABLE</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}