import { useContext } from "react";
import { LocalMemoryContext } from "@/contexts/local-memory-context";

export function useLocalMemory() {
  const context = useContext(LocalMemoryContext);
  if (!context) {
    throw new Error("useLocalMemory must be used within a LocalMemoryProvider");
  }
  return context;
}
