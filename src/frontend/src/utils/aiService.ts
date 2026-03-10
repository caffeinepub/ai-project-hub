/**
 * Shared AI service utility for Pollinations AI calls.
 * Uses the OpenAI-compatible endpoint with fallback to the legacy endpoint.
 * Supports text and vision (image) requests.
 */

import { compressImageDataUrl } from "./compressImage";

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
}

export interface RefImage {
  id?: string;
  name?: string;
  dataUrl: string;
}

// Endpoints to try in order
const ENDPOINTS = [
  "https://text.pollinations.ai/openai",
  "https://api.pollinations.ai/v1/chat/completions",
  "https://text.pollinations.ai/",
];

const RETRY_DELAYS = [1000, 2000, 3000];
const TIMEOUT_MS = 50_000;

/** Parse text from a Pollinations response (handles both plain text and OpenAI JSON format) */
function parseResponseText(raw: string): string {
  try {
    const json = JSON.parse(raw);
    if (json?.choices?.[0]?.message?.content) {
      return json.choices[0].message.content;
    }
  } catch {
    // not JSON, treat as plain text
  }
  return raw;
}

/** Attempt a single fetch with AbortController timeout */
async function fetchWithTimeout(
  url: string,
  body: object,
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const raw = await response.text();
  const text = parseResponseText(raw);
  if (!text.trim()) throw new Error("Empty response");
  return text;
}

/**
 * Call the AI service with retry logic across multiple endpoints.
 * If images are present and all vision attempts fail, retries without images.
 */
export async function callAI(
  messages: AIMessage[],
  model: "openai" | "openai-large" = "openai",
): Promise<string> {
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt - 1]));
    }

    // Try each endpoint per attempt
    const endpointIndex = attempt % ENDPOINTS.length;
    const url = ENDPOINTS[endpointIndex];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const bodyModel = url === "https://text.pollinations.ai/" ? model : model;
      const result = await fetchWithTimeout(
        url,
        {
          model: bodyModel,
          messages,
          seed: 42,
          private: true,
        },
        controller.signal,
      );
      clearTimeout(timeoutId);
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError =
        err instanceof Error
          ? err.name === "AbortError"
            ? new Error("Request timed out")
            : err
          : new Error(String(err));
    }
  }

  throw lastError;
}

/** Compress an array of ref images to small base64 for sending to AI */
export async function compressRefImages(
  images: RefImage[],
  maxDimension = 256,
  quality = 0.5,
): Promise<RefImage[]> {
  return Promise.all(
    images.map(async (img) => ({
      ...img,
      dataUrl: await compressImageDataUrl(img.dataUrl, maxDimension, quality),
    })),
  );
}

/**
 * Build a messages array with optional compressed reference images appended.
 * If withImages is false, images are described as text instead.
 */
export function buildMessagesWithImages(
  base: AIMessage[],
  refImages: RefImage[] | undefined,
  withImages: boolean,
): AIMessage[] {
  if (!refImages || refImages.length === 0) return base;

  if (!withImages) {
    return [
      ...base,
      {
        role: "user" as const,
        content: `Note: The user has ${refImages.length} reference image(s) attached but they could not be loaded. Please proceed based on the text description alone.`,
      },
    ];
  }

  return [
    ...base,
    {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: "Reference images for context (study layout, colors, and style):",
        },
        ...refImages.map((img) => ({
          type: "image_url" as const,
          image_url: { url: img.dataUrl },
        })),
      ],
    },
  ];
}

/**
 * Call AI with optional reference images. If the vision call fails,
 * automatically retries without images (text-only fallback).
 */
export async function callAIWithImages(
  baseMessages: AIMessage[],
  refImages: RefImage[] | undefined,
  model: "openai" | "openai-large" = "openai",
): Promise<string> {
  const hasImages = refImages && refImages.length > 0;

  if (hasImages) {
    // Compress images aggressively first
    const compressed = await compressRefImages(refImages!);
    const messagesWithImages = buildMessagesWithImages(
      baseMessages,
      compressed,
      true,
    );
    try {
      return await callAI(messagesWithImages, "openai-large");
    } catch {
      // Vision failed — fall back to text-only
    }
  }

  // Text-only call (either no images or vision failed)
  const textMessages = buildMessagesWithImages(baseMessages, refImages, false);
  return callAI(textMessages, model);
}
