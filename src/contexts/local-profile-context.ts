import { createContext } from "react";
import type { LocalProfile, NewLocalProfile } from "@/lib/localProfile";

export type LocalProfileState = {
  profile: LocalProfile | null;
  storageError: string | null;
};

export type LocalProfileContextValue = LocalProfileState & {
  registerProfile: (profile: NewLocalProfile) => boolean;
  clearProfile: () => boolean;
};

export const LocalProfileContext = createContext<LocalProfileContextValue | undefined>(undefined);
