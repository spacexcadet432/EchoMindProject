import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLocalMemory } from "@/hooks/use-local-memory";
import { useLocalProfile } from "@/hooks/use-local-profile";

interface ProfileMenuProps {
  align?: "right" | "left";
}

const ProfileMenu = ({ align = "right" }: ProfileMenuProps) => {
  const navigate = useNavigate();
  const { clearMemory } = useLocalMemory();
  const { profile, clearProfile } = useLocalProfile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onSignOut = () => {
    if (!window.confirm("Sign out and clear this device's profile and reflections?")) return;
    const memoryCleared = clearMemory();
    const profileCleared = clearProfile();
    setOpen(false);
    if (memoryCleared && profileCleared) navigate("/", { replace: true });
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
        LM
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
            <p className="text-[13px] font-medium text-foreground">{profile?.name || "This device"}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-strong">
              Roll no. {profile?.rollNumber} · local profile
            </p>
            <p className="mt-0.5 truncate font-mono text-[10px] text-muted-strong">
              ID {profile?.id.slice(0, 8)} · this browser only
            </p>
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
            onClick={onSignOut}
            className="block w-full px-4 py-2.5 text-left text-[13px] text-destructive transition-colors hover:bg-surface-2"
            role="menuitem"
          >
            Sign out and clear this device
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
