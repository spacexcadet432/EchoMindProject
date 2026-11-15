import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import SignIn from "./pages/auth/SignIn.tsx";
import UserDashboard from "./pages/app/UserDashboard.tsx";
import ReflectionInterface from "./pages/app/ReflectionInterface.tsx";
import Archive from "./pages/app/Archive.tsx";
import SafetyPage from "./pages/SafetyPage.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/sign-in" element={<SignIn />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/conversations"
              element={
                <ProtectedRoute>
                  <ReflectionInterface />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/memory"
              element={
                <ProtectedRoute>
                  <Archive />
                </ProtectedRoute>
              }
            />
            <Route path="/safety" element={<SafetyPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
