import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocalMemoryProvider } from "./contexts/LocalMemoryContext.tsx";
import { LocalProfileProvider } from "./contexts/LocalProfileContext.tsx";
import LocalProfileRoute from "./components/auth/LocalProfileRoute.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import SignIn from "./pages/auth/SignIn.tsx";
import UserDashboard from "./pages/app/UserDashboard.tsx";
import ReflectionInterface from "./pages/app/ReflectionInterface.tsx";
import Archive from "./pages/app/Archive.tsx";
import SafetyPage from "./pages/SafetyPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LocalProfileProvider>
          <LocalMemoryProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/sign-in" element={<SignIn />} />
              <Route
                path="/app"
                element={<LocalProfileRoute><UserDashboard /></LocalProfileRoute>}
              />
              <Route
                path="/app/conversations"
                element={<LocalProfileRoute><ReflectionInterface /></LocalProfileRoute>}
              />
              <Route
                path="/app/memory"
                element={<LocalProfileRoute><Archive /></LocalProfileRoute>}
              />
              <Route path="/safety" element={<SafetyPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </LocalMemoryProvider>
        </LocalProfileProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
