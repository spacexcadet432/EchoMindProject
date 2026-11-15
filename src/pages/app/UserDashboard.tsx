import { Link } from "react-router-dom";
import AppShell from "@/components/echomind/app/AppShell";
import { Button } from "@/components/ui/button";
import { useLocalMemory } from "@/hooks/use-local-memory";

const UserDashboard = () => {
  const { turns } = useLocalMemory();
  const reflections = turns.filter((turn) => turn.role === "you");
  const latestReflection = reflections[reflections.length - 1];
  const recentReflections = reflections.slice(-3).reverse();
  const lastEdited = latestReflection
    ? new Date(latestReflection.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <AppShell>
      <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-9 py-8">
        <header>
          <p className="mb-1 text-[12px] tracking-[0.04em] text-muted-strong">LOCAL MEMORY</p>
          <h1 className="mb-1.5 font-display text-[26px] font-medium leading-tight">
            Your reflections, on this device.
          </h1>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <span className="block h-[5px] w-[5px] rounded-full bg-status-pending" />
            Not synced or encrypted
          </p>
        </header>

        <article className="rounded-lg border border-border bg-surface px-6 py-5">
          <p className="mb-3.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-strong">
            Your reflection
          </p>
          <p className="mb-3 font-display text-[20px] italic leading-snug text-foreground">
            {latestReflection
              ? `“${latestReflection.body}”`
              : "Start with whatever has been on your mind."}
          </p>
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-strong">
            <span>Saved in this browser</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="block h-[5px] w-[5px] rounded-full bg-status-active" />
              {turns.length} messages
            </span>
            {lastEdited && <><span>·</span><span>Last edited {lastEdited}</span></>}
          </div>
          <div className="flex items-center justify-between">
            <Button asChild>
              <Link to="/app/conversations">
                {latestReflection ? "Continue reflection →" : "Start a reflection →"}
              </Link>
            </Button>
            <span className="text-[12px] text-muted-strong">Stored locally</span>
          </div>
        </article>

        <section className="rounded-lg border border-border bg-surface px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-foreground">Recent reflections</p>
              <p className="mt-1 text-[12px] text-muted-strong">Only visible in this browser</p>
            </div>
            <Link to="/app/memory" className="text-[12px] text-primary hover:underline">
              View memory
            </Link>
          </div>
          {recentReflections.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Your saved reflections will appear here.</p>
          ) : (
            <ul className="space-y-3">
              {recentReflections.map((reflection) => (
                <li key={reflection.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
                  <p className="truncate font-display text-[15px] italic text-foreground">
                    “{reflection.body}”
                  </p>
                  <p className="mt-1 text-[11px] text-muted-strong">
                    {new Date(reflection.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </AppShell>
  );
};

export default UserDashboard;
