"use client";

import { Spinner } from "./Spinner";

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = "Loading..." }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <div className="text-xl text-white">{message}</div>
      </div>
    </div>
  );
}
