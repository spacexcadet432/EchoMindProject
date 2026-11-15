import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { profileFromUser } from "@/lib/profile";

interface ProfileMenuProps {
  align?: "right" | "left";
}

const ProfileMenu = ({ align = "right" }: ProfileMenuProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const display = profileFromUser(user);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onLogout = async () => {
    await signOut();
    setOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-[28px] w-[28px] items-center justify-center rounded-full border border-border bg-primary-subtle text-[10px] font-medium text-primary transition-colors hover:border-foreground/30",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {display.initials}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-[calc(100%+8px)] z-50 w-[224px] overflow-hidden rounded-md border border-border bg-surface",
            align === "right" ? "right-0" : "left-0",
          )}
          style={{ boxShadow: "0 1px 2px hsl(var(--foreground) / 0.04)" }}
        >
          <div className="px-4 pb-2.5 pt-3">
            <p className="text-[13px] font-medium text-foreground">{display.name || "You"}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-strong">{display.email || "Private session"}</p>
          </div>
          <div className="h-px w-full bg-border" />
          <Link
            to="/app/memory"
            className="block w-full px-4 py-2.5 text-left text-[13px] text-foreground transition-colors hover:bg-surface-2"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Memory
          </Link>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="block w-full px-4 py-2.5 text-left text-[13px] text-foreground transition-colors hover:bg-surface-2"
            role="menuitem"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
