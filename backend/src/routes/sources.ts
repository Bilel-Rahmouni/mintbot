import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, getUserId } from "../middleware/auth";
import { startIngestion } from "../services/ingestion";

const router = Router();
router.use(requireAuth);

const createSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("URL"),
    url: z.string().trim().url().max(2000),
  }),
  z.object({
    type: z.literal("TEXT"),
    title: z.string().trim().min(1).max(120),
    content: z.string().trim().min(20).max(200_000),
  }),
]);

async function findOwnedBot(userId: string, botId: string) {
  return prisma.bot.findFirst({ where: { id: botId, userId } });
}

router.get("/bots/:botId/sources", async (req, res) => {
  const bot = await findOwnedBot(getUserId(req), req.params.botId);
  if (!bot) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }
  const sources = await prisma.source.findMany({
    where: { botId: bot.id },
    orderBy: { createdAt: "desc" },
    omit: { content: true },
  });
  res.json({ sources });
});

router.post("/bots/:botId/sources", async (req, res) => {
  const bot = await findOwnedBot(getUserId(req), req.params.botId);
  if (!bot) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Provide a valid URL, or a title and at least 20 characters of text" });
    return;
  }

  const data = parsed.data;
  const source = await prisma.source.create({
    data:
      data.type === "URL"
        ? { botId: bot.id, type: "URL", url: data.url, title: new URL(data.url).hostname }
        : { botId: bot.id, type: "TEXT", title: data.title, content: data.content },
  });

  startIngestion(source.id);
  res.status(201).json({ source });
});

router.post("/sources/:id/reingest", async (req, res) => {
  const source = await prisma.source.findFirst({
    where: { id: req.params.id, bot: { userId: getUserId(req) } },
  });
  if (!source) {
    res.status(404).json({ error: "Source not found" });
    return;
  }
  if (source.status === "PROCESSING") {
    res.status(409).json({ error: "This source is already being processed" });
    return;
  }
  await prisma.source.update({ where: { id: source.id }, data: { status: "PENDING" } });
  startIngestion(source.id);
  res.json({ ok: true });
});

router.delete("/sources/:id", async (req, res) => {
  const source = await prisma.source.findFirst({
    where: { id: req.params.id, bot: { userId: getUserId(req) } },
  });
  if (!source) {
    res.status(404).json({ error: "Source not found" });
    return;
  }
  await prisma.source.delete({ where: { id: source.id } });
  res.json({ ok: true });
});

export default router;
