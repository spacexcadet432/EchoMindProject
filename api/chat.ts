import type { IncomingMessage, ServerResponse } from "node:http";
import { handleNvidiaChat } from "../server/api/chat";

type VercelRequest = IncomingMessage & { body?: unknown };

export default function handler(req: VercelRequest, res: ServerResponse) {
  return handleNvidiaChat(req, res);
}
