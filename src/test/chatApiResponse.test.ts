import { describe, expect, it } from "vitest";
import { readChatApiResponse } from "@/lib/chatApiResponse";

describe("chat API responses", () => {
  it("reports a useful HTTP error when the server returns plain text", async () => {
    const response = new Response("A server error has occurred", { status: 500 });

    await expect(readChatApiResponse(response)).rejects.toThrow(
      "Chat API returned HTTP 500 without JSON. Check the Vercel function logs.",
    );
  });

  it("reads a valid JSON chat reply", async () => {
    const response = new Response(JSON.stringify({ reply: "I hear you." }), { status: 200 });

    await expect(readChatApiResponse(response)).resolves.toEqual({ reply: "I hear you." });
  });
});
