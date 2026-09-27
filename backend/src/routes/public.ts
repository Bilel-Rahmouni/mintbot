import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../middleware/auth";
import { domainAllowed } from "../lib/domains";
import { getUserPlan, getMonthlyMessages, incrementMonthlyMessages } from "../services/usage";
import { retrieveChunks, type RetrievedChunk } from "../services/retrieval";
import { streamAnswer } from "../services/chat";

const router = Router();

router.get("/bots/:key", async (req, res) => {
  const bot = await prisma.bot.findUnique({ where: { publicKey: req.params.key } });
  if (!bot) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }
  res.json({
    bot: {
      name: bot.name,
      greeting: bot.greeting,
      themeColor: bot.themeColor,
    },
  });
});

const chatSchema = z.object({
  botKey: z.string().min(1),
  message: z.string().trim().min(1).max(4000),
  conversationId: z.string().optional(),
  visitorId: z.string().max(100).optional(),
});

router.post("/chat", async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { botKey, message, conversationId, visitorId } = parsed.data;

  const bot = await prisma.bot.findUnique({ where: { publicKey: botKey } });
  if (!bot) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }

  // The dashboard playground authenticates as the owner and bypasses the domain allowlist.
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const isOwner = token ? verifyToken(token) === bot.userId : false;

  if (!isOwner && !domainAllowed(bot.allowedDomains, req.headers.origin || req.headers.referer)) {
    res.status(403).json({ error: "This domain is not allowed to use this bot" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const send = (data: unknown) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const plan = await getUserPlan(bot.userId);
  const used = await getMonthlyMessages(bot.userId);
  if (used >= plan.messagesPerMonth) {
    send({
      error: "limit_reached",
      message: "This assistant is temporarily unavailable. Please try again later.",
    });
    res.end();
    return;
  }

  let conversation =
    conversationId != null
      ? await prisma.conversation.findFirst({ where: { id: conversationId, botId: bot.id } })
      : null;
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { botId: bot.id, visitorId: visitorId ?? null },
    });
  }
  send({ conversationId: conversation.id });

  const history = (
    await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
  ).reverse();

  await prisma.message.create({
    data: { conversationId: conversation.id, role: "USER", content: message },
  });
  await incrementMonthlyMessages(bot.userId);

  let chunks: RetrievedChunk[] = [];
  try {
    chunks = await retrieveChunks(bot.id, message, 5);
  } catch (error) {
    console.error("Retrieval failed:", error);
  }

  let answer = "";
  try {
    for await (const delta of streamAnswer(bot.name, bot.persona, history, message, chunks)) {
      answer += delta;
      send({ delta });
    }
  } catch (error) {
    console.error("Generation failed:", error);
    send({ error: "generation_failed", message: "Something went wrong. Please try again." });
  }

  if (answer) {
    await prisma.message.create({
      data: { conversationId: conversation.id, role: "ASSISTANT", content: answer },
    });
  }
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  send({ done: true });
  res.end();
});

export default router;
