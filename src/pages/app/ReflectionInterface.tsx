import { useState, useRef, useEffect } from "react";
import AppShell from "@/components/echomind/app/AppShell";
import { Button } from "@/components/ui/button";
import { useLocalMemory } from "@/hooks/use-local-memory";
import { cn } from "@/lib/utils";

const echoFor = (text: string): string => {
  const t = text.trim().toLowerCase();
  if (t.length < 40)
    return "I'm here with you. If you stay with that for another moment, what feels most difficult to say out loud?";
  if (t.includes("but") || t.includes("though"))
    return "I can hear both sides in what you wrote. If they were both true at once, what would you want to say first?";
  return "What feels unfinished in this for you right now?";
};

const formatTurnDate = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const ReflectionInterface = () => {
  const { turns, appendTurn } = useLocalMemory();
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Listening...");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns.length]);

  const save = () => {
    if (!draft.trim()) return;
    const now = new Date();
    const body = draft.trim();
    appendTurn({ role: "you", createdAt: now.toISOString(), body });
    setDraft("");
    setIsResponding(true);
    setLoadingLabel("Listening...");
    setTimeout(() => setLoadingLabel("Thinking..."), 280);
    setTimeout(() => setLoadingLabel("Still here..."), 520);
    setTimeout(() => {
      appendTurn({
        role: "echo",
        createdAt: new Date().toISOString(),
        body: echoFor(body),
      });
      setIsResponding(false);
    }, 600);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      save();
    }
  };

  return (
    <AppShell sidebarCollapsed={focused}>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Sticky prompt header */}
        <header className="flex-shrink-0 border-b border-border bg-background px-7 py-4">
          <p className="mb-1 text-[11px] uppercase tracking-[0.08em] text-muted-strong">Conversations</p>
          <p className="font-display text-[17px] font-medium italic text-foreground">
            What&apos;s been on your mind?
          </p>
          <div className="mt-1 flex items-center justify-between text-[12px] text-muted-strong">
            <span>Saved in this browser only</span>
            <span className="inline-flex items-center gap-1.5 rounded border border-border bg-surface-2 px-2 py-0.5 text-[11px]">
              <span className="block h-[5px] w-[5px] rounded-full bg-status-active" />
              Present and listening
            </span>
          </div>
        </header>

        {/* Entries — editorial, no chat bubbles */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-7">
          {turns.length === 0 ? (
            <div className="mx-auto mt-16 max-w-[460px] text-center">
              <p className="eyelet mb-4">No conversation yet</p>
              <p className="font-display text-[22px] italic leading-snug text-foreground">
                Start anywhere.
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                Say what&apos;s on your mind. You don&apos;t need to phrase it perfectly.
              </p>
            </div>
          ) : (
            turns.map((turn, i) => {
              const next = turns[i + 1];
              const lastInGroup = !next || next.role !== turn.role;
              return (
                <article
                  key={turn.id}
                  className={cn(
                    "group relative pb-5",
                    lastInGroup && i < turns.length - 1 && "mb-5 border-b border-border",
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
          {isResponding && (
            <div className="pt-2 text-[13px] text-muted-foreground">{loadingLabel}</div>
          )}
        </div>

        {/* Composer */}
        <div className="flex-shrink-0 border-t border-border bg-background px-7 pb-5 pt-4">
          <textarea
            ref={taRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={onKey}
            placeholder={
              turns.length === 0
                ? "What's been on your mind?"
                : turns.length % 2 === 0
                  ? "You can start anywhere."
                  : "Say what you didn't say earlier."
            }
            className="block min-h-[74px] w-full resize-none rounded-md border border-border bg-surface-2 px-4 py-3 font-sans text-[14px] leading-[1.7] text-foreground outline-none transition-colors placeholder:text-muted-strong focus:border-primary"
          />
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[11px] text-muted-strong">Saved only on this device · ⌘ + Enter to send</span>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "text-[11px] text-muted-strong transition-opacity",
                  draft.trim() ? "opacity-100" : "opacity-0",
                )}
              >
                {wordCount} word{wordCount !== 1 ? "s" : ""}
              </span>
              <Button onClick={save} disabled={!draft.trim()} size="sm">
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default ReflectionInterface;
