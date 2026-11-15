export const LOCAL_PROFILE_KEY = "echomind.local-profile.v1";

export interface LocalProfile {
  id: string;
  name: string;
  rollNumber: string;
  phoneNumber: string;
  createdAt: string;
}

export type NewLocalProfile = Omit<LocalProfile, "id" | "createdAt">;

type StorageAdapter = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function readLocalProfile(
  storage: StorageAdapter = window.localStorage,
): LocalProfile | null {
  const stored = storage.getItem(LOCAL_PROFILE_KEY);
  if (!stored) return null;

  const parsed: unknown = JSON.parse(stored);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("id" in parsed) ||
    typeof parsed.id !== "string" ||
    !("name" in parsed) ||
    typeof parsed.name !== "string" ||
    !("rollNumber" in parsed) ||
    typeof parsed.rollNumber !== "string" ||
    !("phoneNumber" in parsed) ||
    typeof parsed.phoneNumber !== "string" ||
    !("createdAt" in parsed) ||
    typeof parsed.createdAt !== "string" ||
    !Number.isFinite(Date.parse(parsed.createdAt))
  ) {
    throw new Error("Stored local profile has an unexpected format.");
  }

  return parsed as LocalProfile;
}

export function writeLocalProfile(
  profile: LocalProfile,
  storage: StorageAdapter = window.localStorage,
): void {
  storage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
}

export function clearLocalProfile(
  storage: StorageAdapter = window.localStorage,
): void {
  storage.removeItem(LOCAL_PROFILE_KEY);
}
