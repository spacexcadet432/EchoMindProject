import type { User } from "@supabase/supabase-js";

export function profileFromUser(user: User | null) {
  if (!user)
    return { name: "", email: "", initials: "··" as string };

  const meta = user.user_metadata as Record<string, unknown>;
  const fromMeta =
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name);

  const name =
    fromMeta ||
    user.email?.split("@")[0] ||
    "";

  const email = user.email ?? "";

  const fromParts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  const initials =
    fromParts || (email.slice(0, 2).toUpperCase()) || "··";

  return { name, email, initials };
}
