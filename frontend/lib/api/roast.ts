import { apiRequest } from "./client";
import type { RoastResponse } from "../types";

export async function generateRoastFromImage(
  imageBase64: string
): Promise<RoastResponse> {
  return apiRequest<RoastResponse>("/roast/image", {
    method: "POST",
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
}
