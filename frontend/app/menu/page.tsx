"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function Menu() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black">
      <Button
        onClick={() => {}}
        size="xl"
        className="w-80"
      >
        What Hamster
      </Button>
      <Button
        onClick={() => router.push("/poem")}
        size="xl"
        className="w-80"
      >
        Poem
      </Button>
      <Button
        onClick={() => router.push("/roast")}
        variant="accent"
        size="xl"
        className="w-80"
      >
        Roast
      </Button>
    </div>
  );
}
