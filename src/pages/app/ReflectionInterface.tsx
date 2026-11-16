import { useEffect, useRef, useState } from "react";
import AppShell from "@/components/echomind/app/AppShell";
import { Button } from "@/components/ui/button";
import { useLocalMemory } from "@/hooks/use-local-memory";
import { readChatApiResponse } from "@/lib/chatApiResponse";
import { CRISIS_SUPPORT_MESSAGE, hasCrisisMessage, isCrisisMessage } from "@/lib/crisisSafety";
import { cn } from "@/lib/utils";

const formatTurnDate = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const ReflectionInterface = () => {
  const { turns, appendTurn, clearMemory } = useLocalMemory();
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const crisisLocked = hasCrisisMessage(turns);

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns.length]);

  const requestReply = async (history: typeof turns) => {
    setIsResponding(true);
    setResponseError(null);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-20).map((turn) => ({
            role: turn.role === "you" ? "user" : "assistant",
            content: turn.body,
          })),
        }),
      });
      const result = await readChatApiResponse(response);
      if (!response.ok) {
        if (result.error === "crisis_detected") {
          appendTurn({
            role: "echo",
            createdAt: new Date().toISOString(),
            body: CRISIS_SUPPORT_MESSAGE,
          });
          return;
        }
        if (result.error === "nvidia_configuration_missing") {
          throw new Error("The server is missing NVIDIA_API_KEY or NVIDIA_MODEL. Restart the local server after editing .env, or add both variables to Vercel.");
        }
        if (result.error === "nvidia_configuration_invalid") {
          throw new Error("NVIDIA_API_URL must be a valid HTTPS URL.");
        }
        if (result.providerStatus === 401) {
          throw new Error("NVIDIA rejected the API key (401). Check the key and its access.");
        }
        if (result.providerStatus === 403) {
          throw new Error("NVIDIA denied access (403). Check whether this model is enabled for your account.");
        }
        if (result.providerStatus === 404) {
          throw new Error("NVIDIA could not find this model or endpoint (404). Check NVIDIA_MODEL and NVIDIA_API_URL.");
        }
        if (result.providerStatus === 429) {
          throw new Error("NVIDIA rate limit or usage quota reached (429). Check your account limits.");
        }
        if (result.providerStatus) {
          throw new Error(`NVIDIA returned HTTP ${result.providerStatus}. Check the model, endpoint, and account access.`);
        }
        throw new Error("The chat service returned an unexpected error.");
      }
      if (typeof result.reply !== "string" || !result.reply.trim()) {
        throw new Error("Chat API returned an empty reply.");
      }
      appendTurn({
        role: "echo",
        createdAt: new Date().toISOString(),
        body: result.reply.trim(),
      });
    } catch (error) {
      setResponseError(
        error instanceof Error
          ? error.message
          : "EchoMind couldn't reach the chat service. Check your connection.",
      );
    } finally {
      setIsResponding(false);
    }
  };

  const save = () => {
    const body = draft.trim();
    if (!body || isResponding || crisisLocked) return;

    const userTurn = { role: "you" as const, createdAt: new Date().toISOString(), body };
    const history = [...turns, { ...userTurn, id: "pending" }];
    appendTurn(userTurn);
    setDraft("");
    setResponseError(null);

    if (isCrisisMessage(body)) {
      appendTurn({
        role: "echo",
        createdAt: new Date().toISOString(),
        body: CRISIS_SUPPORT_MESSAGE,
      });
      return;
    }
    void requestReply(history);
  };

  const startNewSession = () => {
    if (
      turns.length > 0 &&
      !window.confirm("Start a new session? This clears all saved conversation turns in this browser.")
    ) {
      return;
    }
    clearMemory();
    setDraft("");
    setResponseError(null);
  };

  const onKey = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      save();
    }
  };

  return (
    <AppShell sidebarCollapsed={focused}>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex-shrink-0 border-b border-border bg-background px-7 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-[0.08em] text-muted-strong">Conversations</p>
              <p className="font-display text-[17px] font-medium italic text-foreground">
                What&apos;s been on your mind?
              </p>
              <p className="mt-1 text-[12px] text-muted-strong">
                Saved in this browser · messages sent to NVIDIA AI for replies
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={startNewSession} disabled={isResponding}>
              New session
            </Button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-7">
          {turns.length === 0 ? (
            <div className="mx-auto mt-16 max-w-[460px] text-center">
              <p className="eyelet mb-4">No conversation yet</p>
              <p className="font-display text-[22px] italic leading-snug text-foreground">Start anywhere.</p>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                Say what&apos;s on your mind. You don&apos;t need to phrase it perfectly.
              </p>
            </div>
          ) : (
            turns.map((turn, index) => {
              const next = turns[index + 1];
              const lastInGroup = !next || next.role !== turn.role;
              return (
                <article
                  key={turn.id}
                  className={cn(
                    "group relative pb-5",
                    lastInGroup && index < turns.length - 1 && "mb-5 border-b border-border",
                    !lastInGroup && "mb-3",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={cn(
                        "text-[10px] font-medium uppercase tracking-[0.12em]",
                        turn.role === "you" ? "text-foreground" : "text-primary",
                      )}
                    >
                      {turn.role === "you" ? "You" : "EchoMind"}
                    </span>
                    {turn.role === "you" && (
                      <span className="text-[11px] text-muted-strong">{formatTurnDate(turn.createdAt)}</span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-[15px] leading-[1.75]",
                      turn.role === "you"
                        ? "text-foreground"
                        : "border-l-2 border-primary/30 pl-4 font-display text-[16px] italic text-muted-foreground",
                    )}
                  >
                    {turn.body}
                  </p>
                </article>
              );
            })
          )}
          {isResponding && <div role="status" className="pt-2 text-[13px] text-muted-foreground">Thinking...</div>}
          {crisisLocked && (
            <section role="alert" className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-5">
              <p className="text-sm leading-relaxed text-foreground">{CRISIS_SUPPORT_MESSAGE}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button asChild>
                  <a href="tel:+919351198034">Call Pallavi Mam · +91 93519 8034</a>
                </Button>
                <Button asChild variant="outline">
                  <a href="tel:14416">Call Tele-MANAS · 14416</a>
                </Button>
                <Button asChild variant="outline">
                  <a href="tel:112">Emergency · 112</a>
                </Button>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                This conversation is paused. Please reach out to someone you trust or use the Safety page for more support.
              </p>
            </section>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-border bg-background px-7 pb-5 pt-4">
          {crisisLocked ? (
            <p className="text-sm text-muted-foreground">This session is paused. Start a new session only when you are ready.</p>
          ) : (
            <>
              <textarea
                ref={taRef}
                value={draft}
                disabled={isResponding}
                onChange={(event) => setDraft(event.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={onKey}
                placeholder="What's been on your mind?"
                className="block min-h-[74px] w-full resize-none rounded-md border border-border bg-surface-2 px-4 py-3 font-sans text-[14px] leading-[1.7] text-foreground outline-none transition-colors placeholder:text-muted-strong focus:border-primary disabled:opacity-60"
              />
              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={cn("text-[11px] text-muted-strong transition-opacity", draft.trim() ? "opacity-100" : "opacity-0")}>
                    {wordCount} word{wordCount !== 1 ? "s" : ""}
                  </span>
                  <Button onClick={save} disabled={!draft.trim() || isResponding} size="sm">
                    Send
                  </Button>
                </div>
              </div>
              {responseError && (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-destructive" role="alert">
                  <span>{responseError}</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => void requestReply(turns)}>
                    Retry reply
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default ReflectionInterface;
