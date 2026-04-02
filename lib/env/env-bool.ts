export function envBool(name: string): boolean {
  const raw = process.env[name];
  if (raw === undefined) return false;

  const normalized = String(raw)
    .trim()
    .toLowerCase()
    .replace(/^['"]|['"]$/g, "");

  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
}

