import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useLocalProfile } from "@/hooks/use-local-profile";

export default function LocalProfileRoute({ children }: { children: ReactNode }) {
  const { profile } = useLocalProfile();
  const location = useLocation();

  if (!profile) {
    return <Navigate to="/auth/sign-in" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
