import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  openaiApiKey: required("OPENAI_API_KEY"),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripePriceStarter: process.env.STRIPE_PRICE_STARTER || "",
  stripePricePro: process.env.STRIPE_PRICE_PRO || "",
  dashboardUrl: process.env.DASHBOARD_URL || "http://localhost:5173",
  apiUrl: process.env.API_URL || "http://localhost:4000",
};
