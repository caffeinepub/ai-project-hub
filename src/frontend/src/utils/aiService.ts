/**
 * Shared AI service utility for Pollinations AI calls.
 * Uses the OpenAI-compatible POST endpoint with fallback to plain GET.
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

// POST endpoints (OpenAI-compatible)
const POST_ENDPOINTS = [
  "https://text.pollinations.ai/openai",
  "https://api.pollinations.ai/v1/chat/completions",
];

const TIMEOUT_MS = 45_000;

/**
 * Parse text from a Pollinations response.
 * Returns the assistant content string, or null if it cannot be extracted.
 */
function parseResponseText(raw: string): string | null {
  try {
    const json = JSON.parse(raw);
    if (json?.choices?.[0]?.message) {
      const msg = json.choices[0].message;
      const text: string | undefined = msg.content || msg.reasoning_content;
      if (text?.trim()) return text.trim();
      return null;
    }
    return null;
  } catch {
    if (raw.trim()) return raw.trim();
    return null;
  }
}

/** Extract plain text from a messages array (for GET fallback) */
function flattenMessagesToText(messages: AIMessage[]): {
  system: string;
  prompt: string;
} {
  let system = "";
  const parts: string[] = [];
  for (const m of messages) {
    if (m.role === "system") {
      system = typeof m.content === "string" ? m.content : "";
    } else {
      const text =
        typeof m.content === "string"
          ? m.content
          : m.content
              .filter(
                (c): c is { type: "text"; text: string } => c.type === "text",
              )
              .map((c) => c.text)
              .join(" ");
      if (text.trim()) parts.push(`${m.role}: ${text.trim()}`);
    }
  }
  return { system, prompt: parts.join("\n") };
}

/** Attempt a single POST fetch with AbortController timeout */
async function fetchPost(
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
  if (!text) throw new Error("Empty or unparseable response");
  return text;
}

/** Attempt a simple GET fetch (no images) with AbortController timeout */
async function fetchGet(
  messages: AIMessage[],
  model: string,
  signal: AbortSignal,
): Promise<string> {
  const { system, prompt } = flattenMessagesToText(messages);
  if (!prompt.trim()) throw new Error("No prompt");
  const url = new URL(
    `https://text.pollinations.ai/${encodeURIComponent(prompt)}`,
  );
  url.searchParams.set("model", model);
  if (system) url.searchParams.set("system", system);
  url.searchParams.set("seed", "42");
  const response = await fetch(url.toString(), { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  if (!text.trim()) throw new Error("Empty GET response");
  return text.trim();
}

/**
 * Call the AI service with retry logic across multiple endpoints.
 * Tries POST endpoints first, then falls back to a reliable GET endpoint.
 */
export async function callAI(
  messages: AIMessage[],
  model: "openai" | "openai-large" = "openai",
): Promise<string> {
  const errors: string[] = [];

  // Try each POST endpoint
  for (const url of POST_ENDPOINTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const result = await fetchPost(
        url,
        { model, messages, seed: 42, private: true },
        controller.signal,
      );
      clearTimeout(timeoutId);
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      errors.push(err instanceof Error ? err.message : String(err));
    }
    // Short pause between attempts
    await new Promise((r) => setTimeout(r, 800));
  }

  // Fall back to GET endpoint (text-only, ignores images in messages)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const result = await fetchGet(messages, model, controller.signal);
    clearTimeout(timeoutId);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    errors.push(err instanceof Error ? err.message : String(err));
  }

  throw new Error(
    `AI service unavailable. Tried all endpoints: ${errors.join(" | ")}`,
  );
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

  const textMessages = buildMessagesWithImages(baseMessages, refImages, false);
  return callAI(textMessages, model);
}
