"use client";

import { Button } from "./Button";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <div className="text-xl text-red-400">{message}</div>
      {onRetry && (
        <Button onClick={onRetry} size="md">
          Retry
        </Button>
      )}
    </div>
  );
}
