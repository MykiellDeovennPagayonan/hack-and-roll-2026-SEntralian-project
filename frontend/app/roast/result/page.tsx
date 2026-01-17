"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RoastResult() {
  const router = useRouter();
  const [roast, setRoast] = useState<string>("");

  useEffect(() => {
    const storedRoast = sessionStorage.getItem("generatedRoast");
    if (storedRoast) {
      setRoast(storedRoast);
    } else {
      router.push("/roast");
    }
  }, [router]);

  const handleTakeAnother = () => {
    sessionStorage.removeItem("generatedRoast");
    router.push("/roast");
  };

  const handleBackToMenu = () => {
    sessionStorage.removeItem("generatedRoast");
    router.push("/menu");
  };

  if (!roast) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-black p-8">
      {/* Roast display */}
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-2xl text-center">
          <h1 className="mb-8 text-2xl font-bold text-orange-500">You Got Roasted!</h1>
          <p className="whitespace-pre-line text-xl leading-relaxed text-white/90">
            {roast}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex w-full max-w-md flex-col gap-4">
        <button
          onClick={handleTakeAnother}
          className="w-full rounded-2xl bg-orange-500 px-8 py-4 text-xl font-bold text-white transition-all hover:scale-105 hover:bg-orange-600 active:scale-95"
        >
          Roast Again
        </button>
        <button
          onClick={handleBackToMenu}
          className="w-full rounded-2xl bg-white/20 px-8 py-4 text-xl font-bold text-white transition-all hover:scale-105 hover:bg-white/30 active:scale-95"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
