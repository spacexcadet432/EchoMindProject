const AmbientVisual = () => {
  return (
    <div className="relative w-full aspect-square max-w-[560px] mx-auto">
      {/* Hairline frame */}
      <div className="absolute inset-0 border border-border rounded-sm" />

      {/* Soft warm wash */}
      <div className="absolute inset-0 overflow-hidden rounded-sm" aria-hidden="true">
        <div
          className="absolute -inset-[20%] animate-drift"
          style={{
            background:
              "radial-gradient(circle at 35% 40%, hsl(var(--accent-subtle)) 0%, transparent 55%), radial-gradient(circle at 70% 65%, hsl(var(--surface-2)) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square rounded-full animate-breathe"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.14) 0%, hsl(var(--primary) / 0.04) 45%, transparent 72%)",
            filter: "blur(28px)",
          }}
        />
      </div>

      {/* Top tick marks */}
      <div className="absolute top-4 left-4 right-4 flex justify-between" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="block w-px h-2 bg-border/70" />
        ))}
      </div>

      {/* Conversation preview — editorial, not chat */}
      <div className="absolute inset-x-0 top-12 bottom-12 flex flex-col px-10 sm:px-14">
        {/* Header row */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-strong">
            Conversation · Ongoing
          </span>
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-strong">
            Tue · 21:14
          </span>
        </div>

        {/* Prompt */}
        <div className="mt-6">
          <p className="eyelet mb-3">Conversation</p>
          <p className="font-display italic text-[18px] sm:text-[20px] leading-snug text-foreground/90">
            I keep replaying what I should have said, even now.
          </p>
        </div>

        {/* Faint, animated text lines — suggest writing in progress */}
        <div className="mt-7 space-y-3 flex-1">
          <div className="h-[7px] w-[92%] rounded-[2px] bg-foreground/10 animate-line-fade" />
          <div
            className="h-[7px] w-[78%] rounded-[2px] bg-foreground/10 animate-line-fade"
            style={{ animationDelay: "0.6s" }}
          />
          <div
            className="h-[7px] w-[88%] rounded-[2px] bg-foreground/10 animate-line-fade"
            style={{ animationDelay: "1.2s" }}
          />
          <div
            className="h-[7px] w-[64%] rounded-[2px] bg-foreground/10 animate-line-fade"
            style={{ animationDelay: "1.8s" }}
          />
          <div className="pt-2" />
          <div
            className="h-[7px] w-[81%] rounded-[2px] bg-foreground/8 animate-line-fade"
            style={{ animationDelay: "2.4s" }}
          />
          <div
            className="h-[7px] w-[44%] rounded-[2px] bg-foreground/8 animate-line-fade"
            style={{ animationDelay: "3.0s" }}
          />
        </div>

        {/* Footer meta */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-strong">
            Private · memory enabled
          </span>
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-strong">
            ⌘ + ⏎
          </span>
        </div>
      </div>

      {/* Bottom corner labels */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-strong">
          ECM · 001
        </span>
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-strong">
          Listening mode
        </span>
      </div>
    </div>
  );
};

export default AmbientVisual;
