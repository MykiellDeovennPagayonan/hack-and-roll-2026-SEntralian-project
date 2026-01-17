"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type CameraState = "loading" | "ready" | "capturing" | "error";

export default function RoastCamera() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraState("loading");
      setError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraState("ready");
      }
    } catch (err) {
      console.error("Camera error:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Camera permission denied. Please allow camera access.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError("Failed to access camera.");
      }
      setCameraState("error");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || cameraState !== "ready") return;

    setCameraState("capturing");
    setError("");

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      const base64 = dataUrl.split(",")[1];

      const response = await fetch("http://localhost:8000/roast/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: base64 }),
      });

      const data = await response.json();

      if (data.success && data.roast) {
        sessionStorage.setItem("generatedRoast", data.roast);
        stopCamera();
        router.push("/roast/result");
      } else {
        setError(data.error || "Failed to generate roast.");
        setCameraState("ready");
      }
    } catch (err) {
      console.error("Capture error:", err);
      if (err instanceof Error) {
        setError(`Error: ${err.message}`);
      } else {
        setError("Failed to capture photo or connect to server.");
      }
      setCameraState("ready");
    }
  };

  const handleBack = () => {
    stopCamera();
    router.push("/menu");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-black">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="absolute left-4 top-4 z-10 rounded-lg bg-white/20 px-4 py-2 text-white backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95"
      >
        Back
      </button>

      {/* Camera view */}
      <div className="relative flex h-full w-full flex-1 items-center justify-center">
        {cameraState === "loading" && (
          <div className="text-xl text-white">Starting camera...</div>
        )}

        {cameraState === "error" && (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="text-xl text-red-400">{error}</div>
            <button
              onClick={startCamera}
              className="rounded-lg bg-white px-6 py-3 font-bold text-black transition-all hover:bg-gray-100 active:scale-95"
            >
              Retry
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full max-h-screen w-full object-cover ${
            cameraState === "ready" || cameraState === "capturing"
              ? "block"
              : "hidden"
          }`}
        />

        {cameraState === "capturing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
              <div className="text-xl text-white">Generating roast...</div>
            </div>
          </div>
        )}
      </div>

      {/* Capture button */}
      {(cameraState === "ready" || cameraState === "capturing") && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <button
            onClick={capturePhoto}
            disabled={cameraState === "capturing"}
            className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-orange-500 bg-orange-500/20 transition-all hover:bg-orange-500/30 active:scale-95 disabled:opacity-50"
          >
            <div className="h-14 w-14 rounded-full bg-orange-500" />
          </button>
        </div>
      )}

      {/* Error toast */}
      {error && cameraState !== "error" && (
        <div className="absolute bottom-32 left-4 right-4 rounded-lg bg-red-500/90 p-4 text-center text-white">
          {error}
        </div>
      )}
    </div>
  );
}
