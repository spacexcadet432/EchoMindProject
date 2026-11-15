import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SignIn = () => {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      <header className="border-b border-border">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="font-display text-[18px] tracking-tight">
            EchoMind
          </Link>
          <span className="text-[13px] text-muted-foreground">Local. Personal. On this device.</span>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[420px] flex-col justify-center px-6 py-16">
        <p className="eyelet mb-4">No account needed</p>
        <h1 className="mb-3 font-display text-[40px] leading-[1.1] tracking-tight">
          Continue on this device.
        </h1>
        <p className="mb-10 text-sm leading-relaxed text-muted-foreground">
          Reflections are stored in this browser only. They are not synced or encrypted, and anyone with access to this browser may be able to read them.
        </p>

        <Button asChild className="w-full">
          <Link to="/app/conversations">Continue locally</Link>
        </Button>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Clear local memory at any time from the app menu.
        </p>
      </section>
    </main>
  );
};

export default SignIn;
