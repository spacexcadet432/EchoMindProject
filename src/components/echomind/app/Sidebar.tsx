import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLocalProfile } from "@/hooks/use-local-profile";

type Item = { to: string; label: string; icon: JSX.Element };

const userItems: Item[] = [
  {
    to: "/app",
    label: "Home",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-[15px] w-[15px]">
        <rect x="2" y="2" width="5" height="5" rx="1.5" fill="currentColor" />
        <rect x="9" y="2" width="5" height="5" rx="1.5" fill="currentColor" opacity=".5" />
        <rect x="2" y="9" width="5" height="5" rx="1.5" fill="currentColor" opacity=".5" />
        <rect x="9" y="9" width="5" height="5" rx="1.5" fill="currentColor" opacity=".5" />
      </svg>
    ),
  },
  {
    to: "/app/conversations",
    label: "Conversations",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-[15px] w-[15px]">
        <path d="M3 2h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/app/memory",
    label: "Memory",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-[15px] w-[15px]">
        <path d="M2 4h12M2 8h9M2 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/safety",
    label: "Safety",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-[15px] w-[15px]">
        <path d="M8 1.8l5.2 2.3v3.8c0 3.3-2.2 5.2-5.2 6.4-3-1.2-5.2-3.1-5.2-6.4V4.1L8 1.8z" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
];

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar = ({ collapsed = false }: SidebarProps) => {
  const { pathname } = useLocation();
  const { profile } = useLocalProfile();
  const initials = profile?.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "LM";

  if (collapsed) {
    return (
      <aside className="flex w-14 min-w-14 flex-col items-center gap-6 border-r border-border bg-background py-5">
        <div className="font-display text-base text-foreground">E</div>
        {userItems.map((item) => {
          const active = pathname === item.to || (item.to !== "/app" && pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex h-[34px] w-[34px] items-center justify-center rounded-md transition-colors",
                active ? "bg-surface-2 text-primary" : "text-muted-foreground/60 hover:bg-surface-2",
              )}
              title={item.label}
            >
              {item.icon}
            </NavLink>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className="flex w-[220px] min-w-[220px] flex-col border-r border-border bg-background py-6">
      <div className="px-5 pb-7 font-display text-[18px] tracking-[0.01em] text-foreground">EchoMind</div>
      <nav className="flex-1">
        {userItems.map((item) => {
          const active = pathname === item.to || (item.to !== "/app" && pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex select-none items-center gap-2.5 border-l-2 border-transparent px-5 py-2.5 text-[13px] transition-colors",
                active
                  ? "border-l-primary bg-surface-2 text-foreground"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <span className={cn("opacity-60", active && "opacity-100")}>{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-border px-5 pt-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-border bg-primary-subtle text-[11px] font-medium text-primary">
            {initials}
          </div>
          <div className="leading-tight">
            <div className="max-w-[130px] truncate text-[13px] text-foreground">{profile?.name || "This device"}</div>
            <div className="text-xs text-muted-foreground">Local profile</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
