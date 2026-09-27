import { Router } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, getUserId } from "../middleware/auth";
import { getUserPlan } from "../services/usage";

const router = Router();
router.use(requireAuth);

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

const updateSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  persona: z.string().max(4000).optional(),
  greeting: z.string().trim().min(1).max(300).optional(),
  themeColor: z.string().regex(HEX_COLOR).optional(),
  allowedDomains: z
    .array(z.string().trim().min(1).max(255))
    .max(20)
    .optional(),
});

function cleanDomain(input: string): string {
  return input
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

router.get("/", async (req, res) => {
  const bots = await prisma.bot.findMany({
    where: { userId: getUserId(req) },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sources: true, conversations: true } } },
  });
  res.json({ bots });
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a bot name" });
    return;
  }
  const userId = getUserId(req);

  const plan = await getUserPlan(userId);
  const count = await prisma.bot.count({ where: { userId } });
  if (count >= plan.maxBots) {
    res.status(403).json({
      error: `The ${plan.name} plan allows ${plan.maxBots} bot${plan.maxBots === 1 ? "" : "s"}. Upgrade to add more.`,
      code: "plan_limit",
    });
    return;
  }

  const bot = await prisma.bot.create({
    data: {
      userId,
      name: parsed.data.name,
      publicKey: `mb_${randomBytes(16).toString("hex")}`,
    },
  });
  res.status(201).json({ bot });
});

router.get("/:id", async (req, res) => {
  const bot = await prisma.bot.findFirst({
    where: { id: req.params.id, userId: getUserId(req) },
    include: { _count: { select: { sources: true, conversations: true } } },
  });
  if (!bot) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }
  res.json({ bot });
});

router.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid bot settings" });
    return;
  }
  const existing = await prisma.bot.findFirst({
    where: { id: req.params.id, userId: getUserId(req) },
  });
  if (!existing) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }

  const data = { ...parsed.data };
  if (data.allowedDomains) {
    data.allowedDomains = [...new Set(data.allowedDomains.map(cleanDomain).filter(Boolean))];
  }
  const bot = await prisma.bot.update({ where: { id: existing.id }, data });
  res.json({ bot });
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.bot.findFirst({
    where: { id: req.params.id, userId: getUserId(req) },
  });
  if (!existing) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }
  await prisma.bot.delete({ where: { id: existing.id } });
  res.json({ ok: true });
});

export default router;
