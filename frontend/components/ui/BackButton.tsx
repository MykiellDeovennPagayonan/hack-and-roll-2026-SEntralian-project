"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
}

export function BackButton({ href = "/menu", onClick }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    router.push(href);
  };

  return (
    <button
      onClick={handleClick}
      className="absolute left-4 top-4 z-10 rounded-lg bg-white/20 px-4 py-2 text-white backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95"
    >
      Back
    </button>
  );
}
