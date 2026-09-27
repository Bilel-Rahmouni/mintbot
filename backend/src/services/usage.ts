import { prisma } from "../lib/prisma";
import { planById, type Plan } from "../config/plans";

export function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7); // "2026-08"
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return planById("free");
  const active = sub.status === "active" || sub.status === "trialing";
  return planById(active ? sub.plan : "free");
}

export async function getMonthlyUsage(
  userId: string
): Promise<{ messages: number; submissions: number }> {
  const record = await prisma.usageRecord.findUnique({
    where: { userId_period: { userId, period: currentPeriod() } },
  });
  return { messages: record?.messages ?? 0, submissions: record?.submissions ?? 0 };
}

export async function getMonthlyMessages(userId: string): Promise<number> {
  return (await getMonthlyUsage(userId)).messages;
}

export async function getMonthlySubmissions(userId: string): Promise<number> {
  return (await getMonthlyUsage(userId)).submissions;
}

async function incrementUsage(userId: string, field: "messages" | "submissions"): Promise<void> {
  const period = currentPeriod();
  await prisma.usageRecord.upsert({
    where: { userId_period: { userId, period } },
    update: { [field]: { increment: 1 } },
    create: { userId, period, [field]: 1 },
  });
}

export async function incrementMonthlyMessages(userId: string): Promise<void> {
  await incrementUsage(userId, "messages");
}

export async function incrementMonthlySubmissions(userId: string): Promise<void> {
  await incrementUsage(userId, "submissions");
}
