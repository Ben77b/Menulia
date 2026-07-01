/**
 * Read server env at request time. Next.js can inline `process.env.MY_VAR` as
 * undefined at build when the var is only available at runtime (e.g. Vercel
 * sensitive env). Dynamic key access avoids that substitution.
 */
export function runtimeEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
