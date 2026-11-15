import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  clearLocalProfile,
  readLocalProfile,
  writeLocalProfile,
} from "@/lib/localProfile";
import type { LocalProfile, NewLocalProfile } from "@/lib/localProfile";
import { LocalProfileContext } from "./local-profile-context";
import type { LocalProfileState } from "./local-profile-context";

function loadInitialProfile(): LocalProfileState {
  try {
    return { profile: readLocalProfile(), storageError: null };
  } catch {
    return {
      profile: null,
      storageError: "This browser's saved profile could not be read.",
    };
  }
}

export function LocalProfileProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadInitialProfile);

  const registerProfile = useCallback((details: NewLocalProfile) => {
    const profile: LocalProfile = {
      ...details,
      id: window.crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    try {
      writeLocalProfile(profile);
      setState({ profile, storageError: null });
      return true;
    } catch {
      setState((current) => ({
        ...current,
        storageError: "This browser could not save the local profile.",
      }));
      return false;
    }
  }, []);

  const clearProfile = useCallback(() => {
    try {
      clearLocalProfile();
      setState({ profile: null, storageError: null });
      return true;
    } catch {
      setState((current) => ({
        ...current,
        storageError: "This browser could not clear the local profile.",
      }));
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({ ...state, registerProfile, clearProfile }),
    [state, registerProfile, clearProfile],
  );

  return <LocalProfileContext.Provider value={value}>{children}</LocalProfileContext.Provider>;
}
