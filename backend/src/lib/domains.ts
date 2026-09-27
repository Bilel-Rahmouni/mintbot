export function domainAllowed(
  allowedDomains: string[],
  originHeader: string | undefined
): boolean {
  if (allowedDomains.length === 0) return true;
  if (!originHeader) return false;
  let host: string;
  try {
    host = new URL(originHeader).hostname.toLowerCase();
  } catch {
    return false;
  }
  return allowedDomains.some((d) => host === d || host.endsWith(`.${d}`));
}
