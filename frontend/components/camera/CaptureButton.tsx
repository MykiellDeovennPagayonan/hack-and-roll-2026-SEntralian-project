"use client";

interface CaptureButtonProps {
  onClick: () => void;
  disabled?: boolean;
  accentColor?: "white" | "orange";
}

export function CaptureButton({
  onClick,
  disabled = false,
  accentColor = "white",
}: CaptureButtonProps) {
  const colorStyles = {
    white: "border-white bg-white/20 hover:bg-white/30",
    orange: "border-orange-500 bg-orange-500/20 hover:bg-orange-500/30",
  };

  const innerColorStyles = {
    white: "bg-white",
    orange: "bg-orange-500",
  };

  return (
    <div className="absolute bottom-8 left-0 right-0 flex justify-center">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex h-20 w-20 items-center justify-center rounded-full border-4 transition-all active:scale-95 disabled:opacity-50 ${colorStyles[accentColor]}`}
      >
        <div className={`h-14 w-14 rounded-full ${innerColorStyles[accentColor]}`} />
      </button>
    </div>
  );
}
