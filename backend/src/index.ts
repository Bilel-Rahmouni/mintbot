import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { env } from "./env";
import authRouter from "./routes/auth";
import botsRouter from "./routes/bots";
import sourcesRouter from "./routes/sources";
import conversationsRouter from "./routes/conversations";
import billingRouter, { stripeWebhook } from "./routes/billing";
import formsRouter from "./routes/forms";
import publicRouter from "./routes/public";
import publicFormsRouter from "./routes/publicForms";

const app = express();
app.use(cors({ origin: true }));

// Stripe needs the raw body for signature verification, so this is mounted before express.json().
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/bots", botsRouter);
app.use("/api", sourcesRouter);
app.use("/api", conversationsRouter);
app.use("/api/billing", billingRouter);
app.use("/api/forms", formsRouter);
app.use("/api/public", publicRouter);
app.use("/api/public", publicFormsRouter);

// Serve the built embed bundles so client sites only need the API host.
const widgetDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../widget/dist");
for (const bundle of ["widget.js", "form.js"]) {
  app.get(`/${bundle}`, (_req, res) => {
    const file = path.join(widgetDist, bundle);
    if (!fs.existsSync(file)) {
      res.status(404).send(`${bundle} not built yet. Run \`npm run build\` inside widget/.`);
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=300");
    res.sendFile(file);
  });
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status =
    err && typeof err === "object" && "status" in err && typeof err.status === "number"
      ? err.status
      : 500;
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(status).json({ error: status === 500 ? "Internal server error" : message });
});

app.listen(env.port, () => {
  console.log(`MintBot API running on http://localhost:${env.port}`);
});
