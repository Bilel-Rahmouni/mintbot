import { prisma } from "../lib/prisma";
import { embedTexts, toVectorLiteral } from "./embeddings";

export interface RetrievedChunk {
  id: string;
  content: string;
  similarity: number;
}

export async function retrieveChunks(
  botId: string,
  query: string,
  limit = 5
): Promise<RetrievedChunk[]> {
  const [embedding] = await embedTexts([query]);
  const vector = toVectorLiteral(embedding);

  const rows = await prisma.$queryRaw<Array<{ id: string; content: string; similarity: number }>>`
    SELECT c.id, c.content, 1 - (c.embedding <=> ${vector}::vector) AS similarity
    FROM "Chunk" c
    JOIN "Source" s ON s.id = c."sourceId"
    WHERE c."botId" = ${botId}
      AND s.status = 'READY'
      AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> ${vector}::vector
    LIMIT ${limit}
  `;
  return rows;
}
