import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  clearLocalMemory as clearStoredMemory,
  readLocalMemory,
  writeLocalMemory,
} from "@/lib/localMemory";
import type { ReflectionTurn } from "@/lib/localMemory";
import { LocalMemoryContext } from "./local-memory-context";
import type { LocalMemoryState } from "./local-memory-context";

function loadInitialMemory(): LocalMemoryState {
  try {
    return { turns: readLocalMemory(), storageError: null };
  } catch {
    return {
      turns: [],
      storageError: "Saved local memory could not be read. Clear memory to start fresh.",
    };
  }
}

export function LocalMemoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadInitialMemory);
  const turnsRef = useRef(state.turns);

  const appendTurn = useCallback((turn: Omit<ReflectionTurn, "id">) => {
    const nextTurns = [
      ...turnsRef.current,
      { ...turn, id: window.crypto.randomUUID() },
    ];
    turnsRef.current = nextTurns;

    try {
      writeLocalMemory(nextTurns);
      setState({ turns: nextTurns, storageError: null });
    } catch {
      setState({
        turns: nextTurns,
        storageError: "This reflection could not be saved in this browser.",
      });
    }
  }, []);

  const clearMemory = useCallback(() => {
    try {
      clearStoredMemory();
      turnsRef.current = [];
      setState({ turns: [], storageError: null });
    } catch {
      setState((current) => ({
        ...current,
        storageError: "Local memory could not be cleared in this browser.",
      }));
    }
  }, []);

  const value = useMemo(
    () => ({ ...state, appendTurn, clearMemory }),
    [state, appendTurn, clearMemory],
  );

  return <LocalMemoryContext.Provider value={value}>{children}</LocalMemoryContext.Provider>;
}
