import AppShell from "@/components/echomind/app/AppShell";
import { useLocalMemory } from "@/hooks/use-local-memory";

const Archive = () => {
  const { turns } = useLocalMemory();
  const reflections = turns.filter((turn) => turn.role === "you").reverse();

  return (
    <AppShell>
      <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-9 py-8">
        <header>
          <p className="eyelet mb-3">Memory</p>
          <h1 className="font-display text-[28px] font-medium leading-tight">Moments that stayed with you.</h1>
          <p className="mt-2 max-w-[560px] text-[13px] leading-relaxed text-muted-foreground">
            Reflections saved only in this browser. They do not sync to other devices.
          </p>
        </header>

        <section className="overflow-hidden rounded-lg border border-border bg-surface">
          {reflections.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">
              No reflections saved yet. Start a conversation to create local memory.
            </p>
          ) : reflections.map((reflection) => (
            <article
              key={reflection.id}
              className="flex items-center justify-between gap-6 border-b border-border px-6 py-4 last:border-b-0"
            >
              <div className="flex min-w-0 items-baseline gap-5">
                <span className="w-[100px] flex-shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-strong">
                  {new Date(reflection.createdAt).toLocaleDateString()}
                </span>
                <span className="truncate font-display text-[16px] italic text-foreground">
                  “{reflection.body}”
                </span>
              </div>
              <span className="flex-shrink-0 text-[11px] text-muted-strong">Saved locally</span>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
};

export default Archive;
