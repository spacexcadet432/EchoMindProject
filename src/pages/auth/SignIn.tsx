import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const SignIn = () => {
  const navigate = useNavigate();
  const { user, signInWithGoogle, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) navigate("/", { replace: true });
  }, [user, isLoading, navigate]);

  const handleGoogle = async () => {
    await signInWithGoogle();
  };

  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      <header className="border-b border-border">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="font-display text-[18px] tracking-tight">
            EchoMind
          </Link>
          <span className="text-[13px] text-muted-foreground">Private. Continuous. Quiet.</span>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[420px] flex-col justify-center px-6 py-16">
        <p className="eyelet mb-4">Sign in</p>
        <h1 className="mb-3 font-display text-[40px] leading-[1.1] tracking-tight">
          Pick up where you left off.
        </h1>
        <p className="mb-10 text-sm leading-relaxed text-muted-foreground">
          Your conversations stay private and connected across sessions.
        </p>

        <Button type="button" className="w-full" onClick={() => void handleGoogle()}>
          Continue with Google
        </Button>
      </section>
    </main>
  );
};

export default SignIn;
