import { describe, expect, it } from "vitest";
import {
  clearLocalMemory,
  LOCAL_MEMORY_KEY,
  readLocalMemory,
  writeLocalMemory,
} from "@/lib/localMemory";
import type { ReflectionTurn } from "@/lib/localMemory";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("local reflection memory", () => {
  it("persists and reads turns from browser storage", () => {
    const storage = createStorage();
    const turns: ReflectionTurn[] = [
      {
        id: "turn-1",
        role: "you",
        createdAt: "2026-11-15T12:00:00.000Z",
        body: "A reflection",
      },
    ];

    writeLocalMemory(turns, storage);

    expect(readLocalMemory(storage)).toEqual(turns);
  });

  it("returns an empty memory when storage has no saved turns", () => {
    expect(readLocalMemory(createStorage())).toEqual([]);
  });

  it("reports invalid stored data instead of treating it as valid memory", () => {
    const storage = createStorage();
    storage.setItem(LOCAL_MEMORY_KEY, "{invalid");

    expect(() => readLocalMemory(storage)).toThrow();
  });

  it("clears saved turns", () => {
    const storage = createStorage();
    storage.setItem(LOCAL_MEMORY_KEY, "[]");

    clearLocalMemory(storage);

    expect(readLocalMemory(storage)).toEqual([]);
  });
});
