import { createContext } from "react";
import type { ReflectionTurn } from "@/lib/localMemory";

export type LocalMemoryState = {
  turns: ReflectionTurn[];
  storageError: string | null;
};

export type LocalMemoryContextValue = LocalMemoryState & {
  appendTurn: (turn: Omit<ReflectionTurn, "id">) => void;
  clearMemory: () => boolean;
};

export const LocalMemoryContext = createContext<LocalMemoryContextValue | undefined>(undefined);
