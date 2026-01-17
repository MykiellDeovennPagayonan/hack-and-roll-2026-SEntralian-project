// Camera types
export type CameraState = "loading" | "ready" | "capturing" | "error";

// API Response types
export interface PoemResponse {
  success: boolean;
  poem?: string;
  error?: string;
}

export interface RoastResponse {
  success: boolean;
  roast?: string;
  error?: string;
}

// Feature types for reusable components
export type FeatureType = "poem" | "roast";

export interface FeatureConfig {
  type: FeatureType;
  endpoint: string;
  storageKey: string;
  resultPath: string;
  capturePath: string;
  responseKey: "poem" | "roast";
  loadingText: string;
  accentColor: string;
  title: string;
  retryButtonText: string;
}

export const FEATURE_CONFIGS: Record<FeatureType, FeatureConfig> = {
  poem: {
    type: "poem",
    endpoint: "/poem/image",
    storageKey: "generatedPoem",
    resultPath: "/poem/result",
    capturePath: "/poem",
    responseKey: "poem",
    loadingText: "Generating poem...",
    accentColor: "white",
    title: "Your Poem",
    retryButtonText: "Take Another Photo",
  },
  roast: {
    type: "roast",
    endpoint: "/roast/image",
    storageKey: "generatedRoast",
    resultPath: "/roast/result",
    capturePath: "/roast",
    responseKey: "roast",
    loadingText: "Generating roast...",
    accentColor: "orange-500",
    title: "You Got Roasted!",
    retryButtonText: "Roast Again",
  },
};
