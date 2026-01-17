"use client";

import { useRouter } from "next/navigation";

export default function Menu() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black">
      <button
        onClick={() => {}}
        className="w-80 rounded-2xl bg-white px-12 py-6 text-2xl font-bold text-black transition-all hover:scale-105 hover:bg-gray-100 active:scale-95"
      >
        What Hamster
      </button>
      <button
        onClick={() => router.push("/poem")}
        className="w-80 rounded-2xl bg-white px-12 py-6 text-2xl font-bold text-black transition-all hover:scale-105 hover:bg-gray-100 active:scale-95"
      >
        Poem
      </button>
      <button
        onClick={() => {}}
        className="w-80 rounded-2xl bg-white px-12 py-6 text-2xl font-bold text-black transition-all hover:scale-105 hover:bg-gray-100 active:scale-95"
      >
        Insult
      </button>
    </div>
  );
}
