import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { crawlSite } from "./crawler";
import { chunkText } from "./chunker";
import { embedTexts, toVectorLiteral } from "./embeddings";
import { getUserPlan } from "./usage";

interface PreparedChunk {
  content: string;
}

export async function runIngestion(sourceId: string): Promise<void> {
  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    include: { bot: true },
  });
  if (!source) return;

  await prisma.source.update({
    where: { id: sourceId },
    data: { status: "PROCESSING", error: null },
  });

  try {
    const plan = await getUserPlan(source.bot.userId);
    const prepared: PreparedChunk[] = [];
    let pageCount = 0;

    if (source.type === "URL" && source.url) {
      const pages = await crawlSite(source.url, plan.pagesPerSource);
      if (pages.length === 0) {
        throw new Error("No readable pages found at this URL");
      }
      pageCount = pages.length;
      for (const page of pages) {
        for (const content of chunkText(page.text, `[${page.title}](${page.url})`)) {
          prepared.push({ content });
        }
      }
    } else {
      pageCount = 1;
      for (const content of chunkText(source.content || "", source.title)) {
        prepared.push({ content });
      }
    }

    if (prepared.length === 0) {
      throw new Error("No content could be extracted from this source");
    }

    const embeddings = await embedTexts(prepared.map((c) => c.content));

    // Replace previous chunks atomically enough for v1: delete, then insert.
    await prisma.chunk.deleteMany({ where: { sourceId } });
    for (let i = 0; i < prepared.length; i++) {
      const vector = toVectorLiteral(embeddings[i]);
      await prisma.$executeRaw`
        INSERT INTO "Chunk" (id, "sourceId", "botId", content, embedding, "createdAt")
        VALUES (${randomUUID()}, ${sourceId}, ${source.botId}, ${prepared[i].content}, ${vector}::vector, now())
      `;
    }

    await prisma.source.update({
      where: { id: sourceId },
      data: { status: "READY", pageCount, chunkCount: prepared.length },
    });
  } catch (error) {
    await prisma.source.update({
      where: { id: sourceId },
      data: {
        status: "ERROR",
        error: error instanceof Error ? error.message : "Ingestion failed",
      },
    });
  }
}

export function startIngestion(sourceId: string): void {
  runIngestion(sourceId).catch((error) => {
    console.error(`Ingestion failed for source ${sourceId}:`, error);
  });
}
