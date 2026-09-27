import * as cheerio from "cheerio";

export interface CrawledPage {
  url: string;
  title: string;
  text: string;
}

const FETCH_TIMEOUT_MS = 15000;
const MIN_TEXT_LENGTH = 80;

async function fetchWithTimeout(url: string): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "MintBotCrawler/1.0 (+https://mintbot.app)" },
    });
    clearTimeout(timer);
    return res;
  } catch {
    return null;
  }
}

function normalizeUrl(raw: string, base: URL): string | null {
  try {
    const url = new URL(raw, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.hostname !== base.hostname) return null;
    url.hash = "";
    // Skip obvious non-HTML assets.
    if (/\.(png|jpe?g|gif|svg|webp|ico|css|js|pdf|zip|mp4|mp3|woff2?)$/i.test(url.pathname)) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

async function urlsFromSitemap(base: URL): Promise<string[]> {
  const res = await fetchWithTimeout(new URL("/sitemap.xml", base).href);
  if (!res || !res.ok) return [];
  const xml = await res.text();
  const urls: string[] = [];
  const matches = xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g);
  for (const match of matches) {
    const normalized = normalizeUrl(match[1], base);
    if (normalized) urls.push(normalized);
  }
  return urls;
}

export async function crawlSite(startUrl: string, maxPages: number): Promise<CrawledPage[]> {
  const base = new URL(startUrl);
  const queue: string[] = [];
  const seen = new Set<string>();
  const pages: CrawledPage[] = [];

  const startHref = normalizeUrl(startUrl, base);
  if (startHref) queue.push(startHref);
  for (const url of await urlsFromSitemap(base)) {
    if (queue.length >= maxPages * 3) break;
    queue.push(url);
  }

  while (queue.length > 0 && pages.length < maxPages) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);

    const res = await fetchWithTimeout(url);
    if (!res || !res.ok) continue;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) continue;

    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, noscript, svg, iframe, nav, footer, header, form").remove();

    const title = $("title").first().text().trim() || url;
    const text = $("body").text().replace(/\s+/g, " ").trim();
    if (text.length >= MIN_TEXT_LENGTH) {
      pages.push({ url, title, text });
    }

    if (pages.length < maxPages) {
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        const normalized = normalizeUrl(href, base);
        if (normalized && !seen.has(normalized)) queue.push(normalized);
      });
    }
  }

  return pages;
}
