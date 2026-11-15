import { describe, expect, it } from "vitest";
import {
  clearLocalProfile,
  LOCAL_PROFILE_KEY,
  readLocalProfile,
  writeLocalProfile,
} from "@/lib/localProfile";
import type { LocalProfile } from "@/lib/localProfile";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("local profile", () => {
  it("persists profile details in browser storage", () => {
    const storage = createStorage();
    const profile: LocalProfile = {
      id: "local-id",
      name: "Example Student",
      rollNumber: "R-123",
      phoneNumber: "+911234567890",
      createdAt: "2026-11-15T12:00:00.000Z",
    };

    writeLocalProfile(profile, storage);

    expect(readLocalProfile(storage)).toEqual(profile);
  });

  it("returns no profile before local registration", () => {
    expect(readLocalProfile(createStorage())).toBeNull();
  });

  it("rejects malformed saved profiles", () => {
    const storage = createStorage();
    storage.setItem(LOCAL_PROFILE_KEY, "{invalid");

    expect(() => readLocalProfile(storage)).toThrow();
  });

  it("clears the saved profile", () => {
    const storage = createStorage();
    storage.setItem(LOCAL_PROFILE_KEY, JSON.stringify({ id: "local-id" }));

    clearLocalProfile(storage);

    expect(readLocalProfile(storage)).toBeNull();
  });
});
