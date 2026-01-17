"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <button
        onClick={() => router.push("/menu")}
        className="rounded-2xl bg-white px-16 py-8 text-4xl font-bold text-black transition-all hover:scale-105 hover:bg-gray-100 active:scale-95"
      >
        Start
      </button>
    </div>
  );
}
