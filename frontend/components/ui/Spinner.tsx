"use client";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
}

const sizeStyles = {
  sm: "h-6 w-6 border-2",
  md: "h-10 w-10 border-3",
  lg: "h-12 w-12 border-4",
};

export function Spinner({ size = "md", color = "white" }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-${color} border-t-transparent ${sizeStyles[size]}`}
      style={{ borderColor: color, borderTopColor: "transparent" }}
    />
  );
}
