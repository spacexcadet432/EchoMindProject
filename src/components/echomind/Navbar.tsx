import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ProfileMenu from "@/components/echomind/app/ProfileMenu";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navLinkClass =
  "text-sm text-muted-foreground hover:text-foreground transition-colors duration-150";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, signInWithGoogle, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const conversationsTo = user ? "/app/conversations" : "/auth/sign-in";
  const memoryTo = user ? "/app/memory" : "/auth/sign-in";

  const mobileNavLinks = useMemo(
    () => [
      { to: "/", label: "Home" },
      { to: conversationsTo, label: "Conversations" },
      { to: memoryTo, label: "Memory" },
      { to: "/safety", label: "Safety" },
    ],
    [user, conversationsTo, memoryTo],
  );

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="container flex h-16 items-center justify-between gap-3">
        <Link to="/" className="shrink-0 text-[15px] font-semibold tracking-tight text-foreground">
          EchoMind
        </Link>

        {/* Desktop — same link row + CTA as before (md+) */}
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-end md:gap-8">
          <Link to="/" className={navLinkClass}>
            Home
          </Link>
          <Link to={conversationsTo} className={navLinkClass}>
            Conversations
          </Link>
          <Link to={memoryTo} className={navLinkClass}>
            Memory
          </Link>
          <Link to="/safety" className={navLinkClass}>
            Safety
          </Link>
          {!user ? (
            <Link
              to="/auth/sign-in"
              className="shrink-0 text-sm px-4 h-9 inline-flex items-center rounded-md border border-border bg-transparent hover:bg-surface-2 text-foreground transition-colors duration-150"
            >
              Start talking
            </Link>
          ) : (
            <ProfileMenu />
          )}
        </div>

        {/* Mobile */}
        <div className="flex md:hidden shrink-0 items-center gap-2">
          {user ? <ProfileMenu /> : null}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <Menu className="h-[18px] w-[18px]" />
              </button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="flex w-[min(100vw,380px)] flex-col gap-0 border-border bg-background p-0 sm:max-w-sm"
            >
              <div className="border-b border-border px-6 pb-5 pt-6">
                <SheetTitle className="text-left font-display text-[15px] font-normal tracking-tight text-foreground">
                  EchoMind
                </SheetTitle>
              </div>

              <nav className="flex flex-1 flex-col gap-0 overflow-y-auto px-2 py-4">
                {mobileNavLinks.map(({ to, label }) => (
                  <SheetClose asChild key={`${label}-${to}`}>
                    <Link
                      to={to}
                      className={cn(
                        "rounded-md px-4 py-3.5 text-[14px] text-foreground transition-colors hover:bg-surface-2",
                      )}
                    >
                      {label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>

              <div className="border-t border-border px-6 py-5">
                {!user ? (
                  <Button
                    type="button"
                    className="w-full"
                    variant="outline"
                    onClick={async () => {
                      closeMobile();
                      await signInWithGoogle();
                    }}
                  >
                    Continue with Google
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-destructive hover:bg-destructive/5 hover:text-destructive"
                    onClick={async () => {
                      await signOut();
                      closeMobile();
                      navigate("/", { replace: true });
                    }}
                  >
                    Logout
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
