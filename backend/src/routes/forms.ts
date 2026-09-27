import { Router } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, getUserId } from "../middleware/auth";
import { getUserPlan } from "../services/usage";
import { formFieldsSchema } from "../config/formFields";

const router = Router();
router.use(requireAuth);

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

const updateSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  submitLabel: z.string().trim().min(1).max(40).optional(),
  successMessage: z.string().trim().min(1).max(300).optional(),
  themeColor: z.string().regex(HEX_COLOR).optional(),
  allowedDomains: z.array(z.string().trim().min(1).max(255)).max(20).optional(),
  fields: formFieldsSchema.optional(),
});

function cleanDomain(input: string): string {
  return input
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

async function findOwnedForm(userId: string, formId: string) {
  return prisma.form.findFirst({ where: { id: formId, userId } });
}

router.get("/", async (req, res) => {
  const forms = await prisma.form.findMany({
    where: { userId: getUserId(req) },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });
  res.json({ forms });
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a form name" });
    return;
  }
  const userId = getUserId(req);

  const plan = await getUserPlan(userId);
  const count = await prisma.form.count({ where: { userId } });
  if (count >= plan.maxForms) {
    res.status(403).json({
      error: `The ${plan.name} plan allows ${plan.maxForms} form${plan.maxForms === 1 ? "" : "s"}. Upgrade to add more.`,
      code: "plan_limit",
    });
    return;
  }

  const form = await prisma.form.create({
    data: {
      userId,
      name: parsed.data.name,
      title: parsed.data.name,
      publicKey: `mf_${randomBytes(16).toString("hex")}`,
      fields: [
        { id: "name", type: "text", label: "Name", required: true },
        { id: "email", type: "email", label: "Email", required: true },
        { id: "message", type: "textarea", label: "Message", required: true },
      ],
    },
  });
  res.status(201).json({ form });
});

router.get("/:id", async (req, res) => {
  const form = await prisma.form.findFirst({
    where: { id: req.params.id, userId: getUserId(req) },
    include: { _count: { select: { submissions: true } } },
  });
  if (!form) {
    res.status(404).json({ error: "Form not found" });
    return;
  }
  res.json({ form });
});

router.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid form settings" });
    return;
  }
  const existing = await findOwnedForm(getUserId(req), req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Form not found" });
    return;
  }

  const data = { ...parsed.data };
  if (data.allowedDomains) {
    data.allowedDomains = [...new Set(data.allowedDomains.map(cleanDomain).filter(Boolean))];
  }
  if (data.fields) {
    const ids = data.fields.map((f) => f.id);
    if (new Set(ids).size !== ids.length) {
      res.status(400).json({ error: "Field ids must be unique" });
      return;
    }
  }
  const form = await prisma.form.update({ where: { id: existing.id }, data });
  res.json({ form });
});

router.delete("/:id", async (req, res) => {
  const existing = await findOwnedForm(getUserId(req), req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Form not found" });
    return;
  }
  await prisma.form.delete({ where: { id: existing.id } });
  res.json({ ok: true });
});

router.get("/:id/submissions", async (req, res) => {
  const form = await findOwnedForm(getUserId(req), req.params.id);
  if (!form) {
    res.status(404).json({ error: "Form not found" });
    return;
  }
  const submissions = await prisma.formSubmission.findMany({
    where: { formId: form.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json({ submissions });
});

router.delete("/:id/submissions/:submissionId", async (req, res) => {
  const form = await findOwnedForm(getUserId(req), req.params.id);
  if (!form) {
    res.status(404).json({ error: "Form not found" });
    return;
  }
  await prisma.formSubmission.deleteMany({
    where: { id: req.params.submissionId, formId: form.id },
  });
  res.json({ ok: true });
});

router.get("/:id/stats", async (req, res) => {
  const form = await findOwnedForm(getUserId(req), req.params.id);
  if (!form) {
    res.status(404).json({ error: "Form not found" });
    return;
  }

  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const [total, perDayRaw, byCountryRaw, points] = await Promise.all([
    prisma.formSubmission.count({ where: { formId: form.id } }),
    prisma.$queryRaw<Array<{ day: string; count: number }>>`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
      FROM "FormSubmission"
      WHERE "formId" = ${form.id} AND "createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.formSubmission.groupBy({
      by: ["country"],
      where: { formId: form.id, country: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.formSubmission.findMany({
      where: { formId: form.id, latitude: { not: null }, longitude: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { latitude: true, longitude: true, city: true, country: true, createdAt: true },
    }),
  ]);

  // Fill missing days so charts show a continuous 30-day series.
  const counts = new Map(perDayRaw.map((r) => [r.day, r.count]));
  const perDay: Array<{ day: string; count: number }> = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    perDay.push({ day: key, count: counts.get(key) ?? 0 });
  }

  res.json({
    total,
    perDay,
    byCountry: byCountryRaw.map((r) => ({ country: r.country, count: r._count._all })),
    points,
  });
});

export default router;
