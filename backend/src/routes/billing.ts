import { Router, type Request, type Response } from "express";
import type Stripe from "stripe";
import { prisma } from "../lib/prisma";
import { requireStripe } from "../lib/stripe";
import { env } from "../env";
import { PLANS, planById } from "../config/plans";
import { requireAuth, getUserId } from "../middleware/auth";
import { getUserPlan, getMonthlyUsage, currentPeriod } from "../services/usage";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  const [plan, usage, botCount, formCount] = await Promise.all([
    getUserPlan(userId),
    getMonthlyUsage(userId),
    prisma.bot.count({ where: { userId } }),
    prisma.form.count({ where: { userId } }),
  ]);
  res.json({
    plan,
    usage: { ...usage, period: currentPeriod() },
    botCount,
    formCount,
    plans: Object.values(PLANS).map((p) => ({
      id: p.id,
      name: p.name,
      priceMonthly: p.priceMonthly,
      maxBots: p.maxBots,
      messagesPerMonth: p.messagesPerMonth,
      pagesPerSource: p.pagesPerSource,
      maxForms: p.maxForms,
      submissionsPerMonth: p.submissionsPerMonth,
      available: p.id === "free" || Boolean(p.stripePriceId),
    })),
  });
});

router.post("/checkout", requireAuth, async (req, res) => {
  const plan = planById(req.body?.plan);
  if (plan.id === "free" || !plan.stripePriceId) {
    res.status(400).json({ error: "This plan is not available for checkout" });
    return;
  }
  const stripe = requireStripe();
  const userId = getUserId(req);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  let subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (!subscription) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId },
    });
    subscription = await prisma.subscription.create({
      data: { userId, stripeCustomerId: customer.id },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: subscription.stripeCustomerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${env.dashboardUrl}/billing?checkout=success`,
    cancel_url: `${env.dashboardUrl}/billing?checkout=cancelled`,
    metadata: { userId, plan: plan.id },
    subscription_data: { metadata: { userId, plan: plan.id } },
  });
  res.json({ url: session.url });
});

router.post("/portal", requireAuth, async (req, res) => {
  const stripe = requireStripe();
  const subscription = await prisma.subscription.findUnique({
    where: { userId: getUserId(req) },
  });
  if (!subscription) {
    res.status(400).json({ error: "No billing account yet — subscribe to a plan first" });
    return;
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${env.dashboardUrl}/billing`,
  });
  res.json({ url: session.url });
});

export async function stripeWebhook(req: Request, res: Response) {
  const stripe = requireStripe();
  const signature = req.headers["stripe-signature"];
  if (!signature || !env.stripeWebhookSecret) {
    res.status(400).json({ error: "Missing webhook signature" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.stripeWebhookSecret);
  } catch {
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const plan = planById(session.metadata?.plan);
      if (userId && plan.id !== "free") {
        await prisma.subscription.update({
          where: { userId },
          data: {
            plan: plan.id,
            status: "active",
            stripeSubscriptionId:
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription?.id ?? null,
          },
        });
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const record = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: sub.id },
      });
      if (record) {
        const planFromMeta = sub.metadata?.plan;
        const periodEnd = sub.items?.data?.[0]?.current_period_end;
        await prisma.subscription.update({
          where: { id: record.id },
          data: {
            status: sub.status,
            ...(planFromMeta ? { plan: planById(planFromMeta).id } : {}),
            ...(periodEnd ? { currentPeriodEnd: new Date(periodEnd * 1000) } : {}),
          },
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const record = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: sub.id },
      });
      if (record) {
        await prisma.subscription.update({
          where: { id: record.id },
          data: { plan: "free", status: "active", stripeSubscriptionId: null },
        });
      }
      break;
    }
  }

  res.json({ received: true });
}

export default router;
