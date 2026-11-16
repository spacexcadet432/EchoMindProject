export type ChatApiPayload = {
  reply?: unknown;
  error?: string;
  providerStatus?: number;
};

function isChatApiPayload(value: unknown): value is ChatApiPayload {
  if (!value || typeof value !== "object") return false;
  return (
    (!("reply" in value) || value.reply === undefined || typeof value.reply === "string") &&
    (!("error" in value) || value.error === undefined || typeof value.error === "string") &&
    (!("providerStatus" in value) ||
      value.providerStatus === undefined ||
      typeof value.providerStatus === "number")
  );
}

export async function readChatApiResponse(response: Response): Promise<ChatApiPayload> {
  const body = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    if (!response.ok) {
      throw new Error(
        `Chat API returned HTTP ${response.status} without JSON. Check the Vercel function logs.`,
      );
    }
    throw new Error("Chat API returned an invalid response.");
  }

  if (!isChatApiPayload(payload)) {
    throw new Error("Chat API returned an invalid response.");
  }
  return payload;
}
