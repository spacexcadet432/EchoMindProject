import AppShell from "@/components/echomind/app/AppShell";

const archive = [
  { date: "Apr 14, 2025", title: "I kept thinking about that silence after the call", entries: 8, status: "Remembered" },
  { date: "Apr 7, 2025", title: "I said yes even though I wanted to say no", entries: 6, status: "Remembered" },
  { date: "Mar 31, 2025", title: "Late-night thoughts I didn't send anyone", entries: 10, status: "Remembered" },
  { date: "Mar 24, 2025", title: "Things I keep circling back to", entries: 7, status: "Remembered" },
  { date: "Mar 17, 2025", title: "What stayed with me this week", entries: 5, status: "Remembered" },
];

const Archive = () => {
  return (
    <AppShell>
      <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-9 py-8">
        <header>
          <p className="eyelet mb-3">Memory</p>
          <h1 className="font-display text-[28px] font-medium leading-tight">Moments that stayed with you.</h1>
          <p className="mt-2 max-w-[560px] text-[13px] leading-relaxed text-muted-foreground">
            Moments, thoughts, and conversations that stayed with you.
          </p>
        </header>

        <section className="overflow-hidden rounded-lg border border-border bg-surface">
          {archive.map((r, i) => (
            <button
              key={i}
              type="button"
              className="group flex w-full items-center justify-between border-b border-border px-6 py-4 text-left transition-colors last:border-b-0 hover:bg-surface-2"
            >
              <div className="flex min-w-0 items-baseline gap-5">
                <span className="w-[100px] flex-shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-strong">
                  {r.date}
                </span>
                <span className="truncate font-display text-[16px] italic text-foreground">
                  &ldquo;{r.title}&rdquo;
                </span>
              </div>
              <div className="flex flex-shrink-0 items-center gap-4 pl-4 text-[11px] text-muted-strong">
                <span>{r.entries} messages</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="block h-[5px] w-[5px] rounded-full bg-status-active" />
                  {r.status}
                </span>
                <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5 opacity-40 transition-opacity group-hover:opacity-70">
                  <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
          ))}
        </section>
      </main>
    </AppShell>
  );
};

export default Archive;
