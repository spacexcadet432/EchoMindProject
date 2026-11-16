import type { IncomingMessage, ServerResponse } from "node:http";
import { hasCrisisMessage } from "../../src/lib/crisisSafety";

type ChatRequest = IncomingMessage & { body?: unknown };
type ChatMessage = { role: "user" | "assistant"; content: string };
type ServerTurn = { role: "you" | "echo"; createdAt: string; body: string };

const MAX_BODY_BYTES = 16_000;
const MAX_TURNS = 20;
const MAX_MESSAGE_LENGTH = 4_000;
const NVIDIA_DEFAULT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

function sendJson(res: ServerResponse, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readBody(req: ChatRequest): Promise<unknown> {
  if (req.body !== undefined) return req.body;

  return new Promise((resolve, reject) => {
    let raw = "";
    let byteCount = 0;
    req.on("data", (chunk: Buffer | string) => {
      const text = chunk.toString();
      byteCount += Buffer.byteLength(text);
      if (byteCount > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large."));
        return;
      }
      raw += text;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    req.on("error", reject);
  });
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.length > 0 &&
    message.content.length <= MAX_MESSAGE_LENGTH
  );
}

function toReflectionTurns(messages: ChatMessage[]): ServerTurn[] {
  return messages.map((message, index) => ({
    id: String(index),
    role: message.role === "user" ? "you" : "echo",
    createdAt: new Date(0).toISOString(),
    body: message.content,
  }));
}

const systemPrompt = `You are EchoMind, an AI reflection companion, not a therapist or a substitute for professional care. Be warm, respectful, non-judgmental, and curious. Reflect the user's feelings and ask at most one gentle, open-ended question. Keep replies concise and avoid clinical diagnoses, treatment instructions, or promises of confidentiality. Never pretend to be human. If a user appears to be in immediate danger or mentions self-harm or suicide, do not continue ordinary counseling; direct them to a trusted person and local crisis or emergency support.`;

export async function handleNvidiaChat(req: ChatRequest, res: ServerResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "method_not_allowed" });
    return;
  }

  let body: unknown;
  try {
    body = await readBody(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body.";
    sendJson(res, message.includes("too large") ? 413 : 400, { error: message });
    return;
  }

  const messages = (body as { messages?: unknown } | null)?.messages;
  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_TURNS ||
    !messages.every(isChatMessage)
  ) {
    sendJson(res, 400, { error: "invalid_messages" });
    return;
  }

  if (hasCrisisMessage(toReflectionTurns(messages))) {
    sendJson(res, 422, { error: "crisis_detected" });
    return;
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  const model = process.env.NVIDIA_MODEL;
  const apiUrl = process.env.NVIDIA_API_URL || NVIDIA_DEFAULT_URL;
  if (!apiKey || !model) {
    sendJson(res, 503, { error: "nvidia_configuration_missing" });
    return;
  }

  let endpoint: URL;
  try {
    endpoint = new URL(apiUrl);
  } catch {
    sendJson(res, 500, { error: "nvidia_configuration_invalid" });
    return;
  }
  if (endpoint.protocol !== "https:") {
    sendJson(res, 500, { error: "nvidia_configuration_invalid" });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.6,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`NVIDIA chat request failed with status ${response.status}.`);
      sendJson(res, 502, { error: "nvidia_request_failed" });
      return;
    }

    const result = await response.json() as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const reply = result.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      console.error("NVIDIA chat response did not contain reply text.");
      sendJson(res, 502, { error: "nvidia_response_invalid" });
      return;
    }

    sendJson(res, 200, { reply: reply.trim() });
  } catch {
    console.error("NVIDIA chat request could not be completed.");
    sendJson(res, 502, { error: "nvidia_request_failed" });
  } finally {
    clearTimeout(timeout);
  }
}
