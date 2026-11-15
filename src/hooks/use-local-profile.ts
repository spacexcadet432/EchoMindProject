import { useContext } from "react";
import { LocalProfileContext } from "@/contexts/local-profile-context";

export function useLocalProfile() {
  const context = useContext(LocalProfileContext);
  if (!context) {
    throw new Error("useLocalProfile must be used within a LocalProfileProvider");
  }
  return context;
}
