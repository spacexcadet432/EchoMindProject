export const LOCAL_MEMORY_KEY = "echomind.local-memory.v1";

export interface ReflectionTurn {
  id: string;
  role: "you" | "echo";
  createdAt: string;
  body: string;
}

type StorageAdapter = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function readLocalMemory(
  storage: StorageAdapter = window.localStorage,
): ReflectionTurn[] {
  const stored = storage.getItem(LOCAL_MEMORY_KEY);
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (turn): turn is ReflectionTurn =>
        typeof turn === "object" &&
        turn !== null &&
        typeof turn.id === "string" &&
        (turn.role === "you" || turn.role === "echo") &&
        typeof turn.createdAt === "string" &&
        Number.isFinite(Date.parse(turn.createdAt)) &&
        typeof turn.body === "string",
    )
  ) {
    throw new Error("Stored local memory has an unexpected format.");
  }

  return parsed;
}

export function writeLocalMemory(
  turns: ReflectionTurn[],
  storage: StorageAdapter = window.localStorage,
): void {
  storage.setItem(LOCAL_MEMORY_KEY, JSON.stringify(turns));
}

export function clearLocalMemory(
  storage: StorageAdapter = window.localStorage,
): void {
  storage.removeItem(LOCAL_MEMORY_KEY);
}
