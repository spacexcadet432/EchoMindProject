import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLocalProfile } from "@/hooks/use-local-profile";

const SignIn = () => {
  const { profile, storageError, registerProfile } = useLocalProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const requestedPath = (location.state as { from?: unknown } | null)?.from;
  const returnTo =
    typeof requestedPath === "string" &&
    (requestedPath === "/app" || requestedPath.startsWith("/app/"))
      ? requestedPath
      : "/app/conversations";

  if (profile) return <Navigate to={returnTo} replace />;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!name.trim() || !rollNumber.trim()) {
      setFormError("Enter your name and roll number.");
      return;
    }

    const trimmedPhone = phoneNumber.trim();
    const digits = trimmedPhone.replace(/\D/g, "");
    if (!/^[+()\d\s-]+$/.test(trimmedPhone) || digits.length < 8 || digits.length > 15) {
      setFormError("Enter a valid phone number.");
      return;
    }

    if (!acknowledged) {
      setFormError("Please acknowledge how this profile is stored.");
      return;
    }

    if (registerProfile({
      name: name.trim(),
      rollNumber: rollNumber.trim(),
      phoneNumber: trimmedPhone,
    })) {
      navigate(returnTo, { replace: true });
    }
  };

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
        <p className="eyelet mb-4">Local profile setup</p>
        <h1 className="mb-3 font-display text-[40px] leading-[1.1] tracking-tight">
          Start on this device.
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          If you have used this browser before, your saved local profile will be recognized. A new device needs its own profile; profiles do not sync or validate roll numbers across devices.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium">Name</label>
            <input
              id="profile-name"
              name="name"
              autoComplete="name"
              maxLength={120}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="roll-number" className="mb-1.5 block text-sm font-medium">Roll number</label>
            <input
              id="roll-number"
              name="rollNumber"
              autoComplete="off"
              maxLength={80}
              required
              value={rollNumber}
              onChange={(event) => setRollNumber(event.target.value)}
              className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="phone-number" className="mb-1.5 block text-sm font-medium">Phone number</label>
            <input
              id="phone-number"
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={24}
              required
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <label className="flex items-start gap-3 rounded-md border border-border bg-surface-2 p-3 text-xs leading-relaxed text-muted-foreground">
            <input
              type="checkbox"
              required
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="mt-0.5"
            />
            <span>
              I understand my profile and reflections are stored in this browser, are not encrypted, and can be read by someone with access to it. When I send a message, it and recent conversation context are sent to the configured NVIDIA AI service to generate a reply.
            </span>
          </label>
          {(formError || storageError) && (
            <p role="alert" className="text-sm text-destructive">
              {formError || storageError}
            </p>
          )}
          <Button type="submit" className="w-full">
            Create local profile and continue
          </Button>
        </form>
      </section>
    </main>
  );
};

export default SignIn;
