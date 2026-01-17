import { apiRequest } from "./client";

// Response from /image/match endpoint
export interface ImageMatchResponse {
  success: boolean;
  matched_image_url?: string;
  extracted_words?: string[];
  similarity_score?: number;
  error?: string;
}

// Response from word extraction (using poem endpoint with special prompt)
export interface WordExtractionResponse {
  success: boolean;
  poem?: string; // Will contain the 3 words
  error?: string;
}

/**
 * Extract 3 descriptive words from an image using LLM
 */
export async function extractWordsFromImage(
  imageBase64: string
): Promise<string[]> {
  const response = await apiRequest<WordExtractionResponse>("/poem/image", {
    method: "POST",
    body: JSON.stringify({
      image_base64: imageBase64,
      prompt:
        "Look at this person and describe their vibe/personality in EXACTLY 3 single words separated by commas. Only output the 3 words, nothing else. Example: mysterious, playful, confident",
    }),
  });

  if (!response.success || !response.poem) {
    throw new Error(response.error || "Failed to extract words from image");
  }

  // Parse the 3 words from the response
  const words = response.poem
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0)
    .slice(0, 3);

  if (words.length === 0) {
    throw new Error("No words extracted from image");
  }

  return words;
}

/**
 * Match words against the image library
 */
export async function matchWordsToImage(
  words: string[]
): Promise<ImageMatchResponse> {
  return apiRequest<ImageMatchResponse>("/image/match", {
    method: "POST",
    body: JSON.stringify({ words }),
  });
}

/**
 * Full flow: Extract words from image, then match to library
 */
export async function matchHamsterImage(imageBase64: string): Promise<{
  words: string[];
  imageUrl: string;
  similarityScore?: number;
}> {
  // Step 1: Extract words from the captured image
  const words = await extractWordsFromImage(imageBase64);

  // Step 2: Match words to image library
  const matchResponse = await matchWordsToImage(words);

  if (!matchResponse.success || !matchResponse.matched_image_url) {
    throw new Error(matchResponse.error || "Failed to find matching image");
  }

  return {
    words: matchResponse.extracted_words || words,
    imageUrl: matchResponse.matched_image_url,
    similarityScore: matchResponse.similarity_score,
  };
}
