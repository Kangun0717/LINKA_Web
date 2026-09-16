/**
 * Typed access to the Vite environment variables LINKA relies on.
 * Values are read at build time from `.env` (see `.env.example`).
 */
function requireEnv(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable "${key}". Copy .env.example to .env and fill it in.`,
    )
  }

  return value
}

export const env = {
  supabaseUrl: () => requireEnv('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabasePublishableKey: () =>
    requireEnv('VITE_SUPABASE_PUBLISHABLE_KEY', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
}
