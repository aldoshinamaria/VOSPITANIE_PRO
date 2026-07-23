export type WorkDataBackend = "local" | "supabase";

type PublicEnvironment = Partial<
  Record<
    "NEXT_PUBLIC_DATA_BACKEND" | "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" | "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    string
  >
>;

const publicEnvironment: PublicEnvironment = {
  NEXT_PUBLIC_DATA_BACKEND: process.env.NEXT_PUBLIC_DATA_BACKEND,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

export function resolveWorkDataBackend(environment: PublicEnvironment = publicEnvironment): WorkDataBackend {
  if (environment.NEXT_PUBLIC_DATA_BACKEND !== "supabase") {
    return "local";
  }

  const hasUrl = Boolean(environment.NEXT_PUBLIC_SUPABASE_URL);
  const hasKey = Boolean(
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? environment.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return hasUrl && hasKey ? "supabase" : "local";
}

export function isSupabaseBackendEnabled(environment: PublicEnvironment = publicEnvironment) {
  return resolveWorkDataBackend(environment) === "supabase";
}
