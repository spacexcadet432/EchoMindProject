type SafetyTurn = { role: "you" | "echo"; body: string };

const crisisPatterns = [
  /\b(?:suicid(?:e|al)|self[\s-]?harm|self[\s-]?injur(?:y|e|ing))\b/i,
  /\b(?:kill|hurt|harm|cut)\s+(?:myself|me)\b/i,
  /\b(?:want|wanna|wish|plan|going)\s+to\s+(?:die|end\s+my\s+life|kill\s+myself)\b/i,
  /\b(?:end|take)\s+my\s+life\b/i,
  /\b(?:don['’]?t|do not|cannot|can['’]?t)\s+(?:want|wish)\s+to\s+live\b/i,
  /\b(?:bad|dark|harmful)\s+thoughts?\b/i,
  /\b(?:khudkushi|aatmahatya|marna chahta|marna chahti|jeene ka man nahi)\b/i,
];

export const CRISIS_SUPPORT_MESSAGE =
  "I'm an AI, not a therapist, and I can't provide crisis support. Please contact Pallavi Mam now. If you may be in immediate danger, call 112 or Tele-MANAS at 14416. If you can, stay with someone you trust while you reach out.";

export function isCrisisMessage(text: string): boolean {
  return crisisPatterns.some((pattern) => pattern.test(text));
}

export function hasCrisisMessage(turns: SafetyTurn[]): boolean {
  return turns.some((turn) => turn.role === "you" && isCrisisMessage(turn.body));
}
