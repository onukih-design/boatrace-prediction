import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalUsers,
    activeUsers,
    todayRaces,
    todayPredictions,
    recentHit,
    deliveryToday,
  ] = await Promise.all([
    prisma.lineUser.count(),
    prisma.lineUser.count({ where: { isActive: true } }),
    prisma.race.count({
      where: { raceDate: { gte: today, lt: tomorrow } },
    }),
    prisma.prediction.count({
      where: { race: { raceDate: { gte: today, lt: tomorrow } } },
    }),
    prisma.hitSummary.findFirst({
      orderBy: { targetDate: "desc" },
    }),
    prisma.deliveryLog.count({
      where: { sentAt: { gte: today, lt: tomorrow } },
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    activeUsers,
    todayRaces,
    todayPredictions,
    hitRate: recentHit?.hitRate ?? 0,
    deliveryToday,
  });
}
