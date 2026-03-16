import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDailyPredictions } from "@/lib/prediction/engine";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [hitHistory, todayPreds] = await Promise.all([
    prisma.hitSummary.findMany({
      orderBy: { targetDate: "desc" },
      take: 14,
    }),
    prisma.prediction.findMany({
      where: {
        race: { raceDate: { gte: today, lt: tomorrow } },
        rank: { lte: 3 },
      },
      include: {
        race: { include: { venue: true } },
      },
      orderBy: [
        { race: { venueId: "asc" } },
        { race: { raceNumber: "asc" } },
        { rank: "asc" },
      ],
    }),
  ]);

  // レースごとにグループ化
  const grouped = todayPreds.reduce(
    (acc, pred) => {
      const key = pred.raceId;
      if (!acc[key]) {
        acc[key] = {
          raceId: pred.raceId,
          venue: pred.race.venue.name,
          raceNumber: pred.race.raceNumber,
          picks: [],
          isHit: pred.isHit,
        };
      }
      acc[key].picks.push({ lane: pred.lane, rank: pred.rank, score: pred.score });
      return acc;
    },
    {} as Record<number, any>
  );

  return NextResponse.json({
    hitHistory,
    todayPredictions: Object.values(grouped),
  });
}

export async function POST() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const predictions = await generateDailyPredictions(today);

    return NextResponse.json({
      success: true,
      message: `${predictions.length}レースの予想を生成しました`,
      predictions,
    });
  } catch (error) {
    console.error("Prediction generation error:", error);
    return NextResponse.json(
      { error: "予想生成に失敗しました" },
      { status: 500 }
    );
  }
}
