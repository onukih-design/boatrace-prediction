import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 公開API: 予想一覧（ユーザー向け）
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");
  const venueCode = searchParams.get("venue");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = {};

  if (date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    where.race = { raceDate: { gte: targetDate, lt: nextDate } };
  }

  if (venueCode) {
    where.race = {
      ...where.race,
      venue: { code: venueCode },
    };
  }

  // 上位3位までの予想のみ
  where.rank = { lte: 3 };

  const [predictions, total] = await Promise.all([
    prisma.prediction.findMany({
      where,
      include: {
        race: {
          include: {
            venue: true,
            entries: {
              include: { racer: true },
              orderBy: { lane: "asc" },
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { race: { raceDate: "desc" } },
        { race: { venueId: "asc" } },
        { race: { raceNumber: "asc" } },
        { rank: "asc" },
      ],
    }),
    prisma.prediction.count({ where }),
  ]);

  return NextResponse.json({
    predictions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
