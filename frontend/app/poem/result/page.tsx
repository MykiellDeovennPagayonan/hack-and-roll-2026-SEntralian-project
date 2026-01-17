"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PoemResult() {
  const router = useRouter();
  const [poem, setPoem] = useState<string>("");

  useEffect(() => {
    const storedPoem = sessionStorage.getItem("generatedPoem");
    if (storedPoem) {
      setPoem(storedPoem);
    } else {
      router.push("/poem");
    }
  }, [router]);

  const handleTakeAnother = () => {
    sessionStorage.removeItem("generatedPoem");
    router.push("/poem");
  };

  const handleBackToMenu = () => {
    sessionStorage.removeItem("generatedPoem");
    router.push("/menu");
  };

  if (!poem) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-black p-8">
      {/* Poem display */}
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-2xl text-center">
          <h1 className="mb-8 text-2xl font-bold text-white">Your Poem</h1>
          <p className="whitespace-pre-line text-xl leading-relaxed text-white/90">
            {poem}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex w-full max-w-md flex-col gap-4">
        <button
          onClick={handleTakeAnother}
          className="w-full rounded-2xl bg-white px-8 py-4 text-xl font-bold text-black transition-all hover:scale-105 hover:bg-gray-100 active:scale-95"
        >
          Take Another Photo
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
