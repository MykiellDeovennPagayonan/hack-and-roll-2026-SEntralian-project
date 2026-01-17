import { apiRequest } from "./client";
import type { PoemResponse } from "../types";

export async function generatePoemFromImage(
  imageBase64: string
): Promise<PoemResponse> {
  return apiRequest<PoemResponse>("/poem/image", {
    method: "POST",
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
}
