import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, getUserId } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/bots/:botId/conversations", async (req, res) => {
  const bot = await prisma.bot.findFirst({
    where: { id: req.params.botId, userId: getUserId(req) },
  });
  if (!bot) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }
  const conversations = await prisma.conversation.findMany({
    where: { botId: bot.id },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, role: true } },
    },
  });
  res.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: c._count.messages,
      lastMessage: c.messages[0] ?? null,
    })),
  });
});

router.get("/conversations/:id", async (req, res) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: req.params.id, bot: { userId: getUserId(req) } },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.json({ conversation });
});

export default router;
