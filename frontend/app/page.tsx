"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Button
        onClick={() => router.push("/menu")}
        size="xl"
      >
        Start
      </Button>
    </div>
  );
}
