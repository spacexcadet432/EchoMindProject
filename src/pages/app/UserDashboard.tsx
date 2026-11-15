import { Link } from "react-router-dom";
import AppShell from "@/components/echomind/app/AppShell";
import { Button } from "@/components/ui/button";
import { profileFromUser } from "@/lib/profile";
import { useAuth } from "@/contexts/AuthContext";

const UserDashboard = () => {
  const { user } = useAuth();
  const display = profileFromUser(user);
  const firstName = display.name.split(" ")[0] || "there";

  return (
    <AppShell>
      <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-9 py-8">
        {/* Greeting */}
        <header>
          <p className="mb-1 text-[12px] tracking-[0.04em] text-muted-strong">TUESDAY, APRIL 22</p>
          <h1 className="mb-1.5 font-display text-[26px] font-medium leading-tight">
            Good morning
            {firstName ? `, ${firstName}.` : "."}
          </h1>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <span className="block h-[5px] w-[5px] rounded-full bg-status-pending" />
            You left off 2 days ago
          </p>
        </header>

        {/* Active conversation */}
        <article className="rounded-lg border border-border bg-surface px-6 py-5">
          <p className="mb-3.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-strong">
            Active conversation
          </p>
          <p className="mb-3 font-display text-[20px] italic leading-snug text-foreground">
            &ldquo;I keep replaying the same conversation with my sister.&rdquo;
          </p>
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-strong">
            <span>Continuous thread enabled</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="block h-[5px] w-[5px] rounded-full bg-status-active" />
              12 messages
            </span>
            <span>·</span>
            <span>Last edited yesterday, 11:32pm</span>
          </div>
          <div className="flex items-center justify-between">
            <Button asChild>
              <Link to="/app/conversations">Continue conversation →</Link>
            </Button>
            <span className="text-[12px] text-muted-strong">Ongoing</span>
          </div>
        </article>

        {/* History */}
        <Link
          to="/app/memory"
          className="group rounded-lg border border-border bg-surface px-6 py-5 text-left transition-colors hover:border-foreground/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-foreground">
                April 14 — &quot;You said you felt stuck after that call.&quot;
              </p>
              <p className="mt-1 text-[12px] text-muted-strong">8 messages · Memory saved</p>
            </div>
            <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5 text-muted-strong opacity-40 transition-opacity group-hover:opacity-70">
              <path d="M4 5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>

        <Link
          to="/app/memory"
          className="group rounded-lg border border-border bg-surface px-6 py-5 text-left transition-colors hover:border-foreground/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-foreground">
                April 7 — &quot;You came back to the same thought at 2:10am.&quot;
              </p>
              <p className="mt-1 text-[12px] text-muted-strong">6 messages · Memory saved</p>
            </div>
            <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5 text-muted-strong opacity-40 transition-opacity group-hover:opacity-70">
              <path d="M4 5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>
      </main>
    </AppShell>
  );
};

export default UserDashboard;
