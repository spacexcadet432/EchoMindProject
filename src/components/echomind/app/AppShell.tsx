import { ReactNode, useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import ProfileMenu from "./ProfileMenu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppShellProps {
  children: ReactNode;
  sidebarCollapsed?: boolean;
}

const AppShell = ({ children, sidebarCollapsed = false }: AppShellProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans text-foreground antialiased">
      {/* Desktop sidebar */}
      {!isMobile && <Sidebar collapsed={sidebarCollapsed} />}

      {/* Mobile sidebar — overlay */}
      {isMobile && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="left"
            className="w-[80%] max-w-[300px] border-r border-border bg-background p-0"
          >
            <div onClick={() => setOpen(false)}>
              <Sidebar />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-12 min-h-12 flex-shrink-0 items-center justify-between border-b border-border bg-background px-4 md:px-6">
          {isMobile ? (
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
          ) : (
            <span />
          )}
          <ProfileMenu />
        </header>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
};

export default AppShell;
