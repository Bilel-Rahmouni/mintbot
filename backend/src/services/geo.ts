export interface GeoResult {
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

function isPrivateIp(ip: string): boolean {
  return (
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("fc") ||
    ip.startsWith("fe80")
  );
}

export async function lookupGeo(ip: string | undefined): Promise<GeoResult | null> {
  if (!ip) return null;
  const clean = ip.replace(/^::ffff:/, "").trim();
  if (!clean || isPrivateIp(clean)) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(clean)}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.success) return null;
    return {
      country: typeof data.country === "string" ? data.country : null,
      city: typeof data.city === "string" ? data.city : null,
      latitude: typeof data.latitude === "number" ? data.latitude : null,
      longitude: typeof data.longitude === "number" ? data.longitude : null,
    };
  } catch {
    return null;
  }
}
