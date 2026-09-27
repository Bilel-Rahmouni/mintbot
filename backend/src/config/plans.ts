import { env } from "../env";

export type PlanId = "free" | "starter" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  stripePriceId: string | null;
  maxBots: number;
  messagesPerMonth: number;
  pagesPerSource: number;
  maxForms: number;
  submissionsPerMonth: number;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    stripePriceId: null,
    maxBots: 1,
    messagesPerMonth: 50,
    pagesPerSource: 20,
    maxForms: 1,
    submissionsPerMonth: 50,
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthly: 19,
    stripePriceId: env.stripePriceStarter || null,
    maxBots: 3,
    messagesPerMonth: 2000,
    pagesPerSource: 200,
    maxForms: 3,
    submissionsPerMonth: 1000,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 49,
    stripePriceId: env.stripePricePro || null,
    maxBots: 10,
    messagesPerMonth: 10000,
    pagesPerSource: 1000,
    maxForms: 10,
    submissionsPerMonth: 5000,
  },
};

export function planById(id: string | null | undefined): Plan {
  if (id && id in PLANS) return PLANS[id as PlanId];
  return PLANS.free;
}
