"use client";

import { useRouter } from "next/navigation";

export default function Menu() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] font-mono">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,rgba(0,255,65,0.03)_0px,rgba(0,255,65,0.03)_1px,transparent_1px,transparent_2px)] opacity-40" />
      
      {/* Header */}
      <header className="border-b-2 border-[#00ff41] bg-black/80 p-4 md:p-6">
        <div className="flex items-center justify-between text-sm md:text-base tracking-widest text-[#00ff41]">
          <span>●MAIN MENU</span>
          <span className="animate-pulse">█▓▒░ 01</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-2xl">
          {/* Main Panel */}
          <div className="border-4 border-[#00ff41] bg-[#0a0a0a] p-2 shadow-[0_0_30px_rgba(0,255,65,0.4)]">
            {/* Title Bar */}
            <div className="border-2 border-[#00ff41] bg-black px-4 py-3 md:py-4">
              <div className="text-center text-lg md:text-2xl tracking-widest text-[#00ff41]">
                SELECT OPERATION
              </div>
            </div>

            {/* Menu Items */}
            <div className="mt-2 space-y-2">
              <button
                onClick={() => router.push("/hamster")}
                className="w-full border-2 border-[#00ff41] bg-black py-6 md:py-8 text-left px-6 md:px-8 text-base md:text-xl tracking-widest text-[#00ff41] transition-all hover:bg-[#00ff41] hover:text-black active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <span>► HAMSTER ANALYSIS</span>
                  <span className="text-sm md:text-base opacity-60">[01]</span>
                </div>
              </button>

              <button
                onClick={() => router.push("/roast")}
                className="w-full border-2 border-[#ff0041] bg-black py-6 md:py-8 text-left px-6 md:px-8 text-base md:text-xl tracking-widest text-[#ff0041] transition-all hover:bg-[#ff0041] hover:text-black active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <span>► ROAST MODE</span>
                  <span className="text-sm md:text-base opacity-60">[02]</span>
                </div>
              </button>
            </div>

            {/* Footer Bar */}
            <div className="mt-2 border-2 border-[#00ff41] bg-black px-4 py-2 md:py-3 text-xs md:text-sm tracking-widest text-[#00ff41]/60">
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