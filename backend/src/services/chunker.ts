const MAX_CHUNK_CHARS = 1500;
const OVERLAP_CHARS = 200;
const MAX_CHUNKS_PER_DOC = 200;

export function chunkText(text: string, titlePrefix?: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length && chunks.length < MAX_CHUNKS_PER_DOC) {
    let end = Math.min(start + MAX_CHUNK_CHARS, clean.length);
    // Try to break on a sentence or word boundary rather than mid-word.
    if (end < clean.length) {
      const window = clean.slice(start, end);
      const lastPeriod = window.lastIndexOf(". ");
      const lastSpace = window.lastIndexOf(" ");
      if (lastPeriod > MAX_CHUNK_CHARS * 0.5) end = start + lastPeriod + 1;
      else if (lastSpace > MAX_CHUNK_CHARS * 0.5) end = start + lastSpace;
    }
    const body = clean.slice(start, end).trim();
    if (body) chunks.push(titlePrefix ? `${titlePrefix}\n${body}` : body);
    if (end >= clean.length) break;
    start = Math.max(end - OVERLAP_CHARS, start + 1);
  }
  return chunks;
}
