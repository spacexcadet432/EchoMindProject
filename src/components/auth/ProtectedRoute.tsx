import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-1 flex-col items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Listening…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
