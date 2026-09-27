import Stripe from "stripe";
import { env } from "../env";

export const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;

export function requireStripe(): Stripe {
  if (!stripe) {
    throw Object.assign(new Error("Stripe is not configured (STRIPE_SECRET_KEY missing)"), {
      status: 503,
    });
  }
  return stripe;
}
