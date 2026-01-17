"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { usePrinter } from "@/lib/contexts";

export default function Home() {
  const router = useRouter();
  const { isConnected, device } = usePrinter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black p-8">
      {/* Printer Status */}
      <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
        <div
          className={`h-2 w-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-zinc-600"
          }`}
        />
        <span className="text-sm text-zinc-400">
          {isConnected ? device?.name || "Printer connected" : "No printer"}
        </span>
      </div>

      {/* Main Buttons */}
      <div className="flex flex-col gap-4">
        <Button onClick={() => router.push("/menu")} size="xl">
          Start
        </Button>
        <Button
          onClick={() => router.push("/printer")}
          variant="secondary"
          size="lg"
        >
          {isConnected ? "Printer Settings" : "Connect Printer"}
        </Button>
      </div>
    </div>
  );
}
