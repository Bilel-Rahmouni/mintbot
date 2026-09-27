import { Router } from "express";
import { prisma } from "../lib/prisma";
import { domainAllowed } from "../lib/domains";
import {
  getUserPlan,
  getMonthlySubmissions,
  incrementMonthlySubmissions,
} from "../services/usage";
import { lookupGeo } from "../services/geo";
import { parseFields } from "../config/formFields";

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_VALUE_LENGTH = 2000;

router.get("/forms/:key", async (req, res) => {
  const form = await prisma.form.findUnique({ where: { publicKey: req.params.key } });
  if (!form) {
    res.status(404).json({ error: "Form not found" });
    return;
  }
  res.json({
    form: {
      title: form.title,
      description: form.description,
      submitLabel: form.submitLabel,
      themeColor: form.themeColor,
      fields: parseFields(form.fields),
    },
  });
});

router.post("/forms/:key/submit", async (req, res) => {
  const form = await prisma.form.findUnique({ where: { publicKey: req.params.key } });
  if (!form) {
    res.status(404).json({ error: "Form not found" });
    return;
  }

  const origin = req.headers.origin || req.headers.referer;
  if (!domainAllowed(form.allowedDomains, origin)) {
    res.status(403).json({ error: "This domain is not allowed to use this form" });
    return;
  }

  const plan = await getUserPlan(form.userId);
  const used = await getMonthlySubmissions(form.userId);
  if (used >= plan.submissionsPerMonth) {
    res.status(429).json({ error: "This form is temporarily unavailable. Please try again later." });
    return;
  }

  const fields = parseFields(form.fields);
  const body = (req.body ?? {}) as Record<string, unknown>;
  const data: Record<string, string | boolean> = {};
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const raw = body[field.id];
    if (field.type === "checkbox") {
      const checked = raw === true;
      if (field.required && !checked) errors[field.id] = "Required";
      data[field.id] = checked;
      continue;
    }
    const value = typeof raw === "string" ? raw.trim().slice(0, MAX_VALUE_LENGTH) : "";
    if (!value) {
      if (field.required) errors[field.id] = "Required";
      data[field.id] = "";
      continue;
    }
    if (field.type === "email" && !EMAIL_REGEX.test(value)) {
      errors[field.id] = "Enter a valid email";
    }
    if (field.type === "select" && field.options && !field.options.includes(value)) {
      errors[field.id] = "Invalid option";
    }
    data[field.id] = value;
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ error: "Validation failed", fieldErrors: errors });
    return;
  }

  const pageUrl = typeof req.headers.referer === "string" ? req.headers.referer.slice(0, 500) : null;
  const submission = await prisma.formSubmission.create({
    data: { formId: form.id, data, pageUrl },
  });
  await incrementMonthlySubmissions(form.userId);

  // Geolocation runs after the response; the visitor shouldn't wait on it.
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    (typeof forwarded === "string" ? forwarded.split(",")[0] : forwarded?.[0]) ||
    req.socket.remoteAddress ||
    undefined;
  lookupGeo(ip)
    .then((geo) => {
      if (!geo) return;
      return prisma.formSubmission.update({
        where: { id: submission.id },
        data: {
          country: geo.country,
          city: geo.city,
          latitude: geo.latitude,
          longitude: geo.longitude,
        },
      });
    })
    .catch(() => {});

  res.status(201).json({ ok: true, successMessage: form.successMessage });
});

export default router;
