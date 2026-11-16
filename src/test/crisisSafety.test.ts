import { describe, expect, it } from "vitest";
import { hasCrisisMessage, isCrisisMessage } from "@/lib/crisisSafety";

describe("crisis message detection", () => {
  it.each([
    "I am thinking about suicide",
    "I want to kill myself",
    "I might hurt myself",
    "I have bad thoughts",
    "khudkushi",
  ])("detects a crisis phrase: %s", (message) => {
    expect(isCrisisMessage(message)).toBe(true);
  });

  it("does not trigger for an ordinary reflection", () => {
    expect(isCrisisMessage("I had a hard day and feel worried about exams.")).toBe(false);
  });

  it("locks a saved conversation when a user turn contains a crisis phrase", () => {
    expect(
      hasCrisisMessage([
        { role: "you", body: "I want to die" },
      ]),
    ).toBe(true);
  });
});
