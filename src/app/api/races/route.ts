import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 公開API: レース一覧
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");
  const venueCode = searchParams.get("venue");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};

  if (date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    where.raceDate = { gte: targetDate, lt: nextDate };
  }
  if (venueCode) {
    where.venue = { code: venueCode };
  }

  const [races, total] = await Promise.all([
    prisma.race.findMany({
      where,
      include: {
        venue: true,
        predictions: {
          where: { rank: { lte: 3 } },
          orderBy: { rank: "asc" },
        },
        _count: { select: { entries: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ raceDate: "desc" }, { venueId: "asc" }, { raceNumber: "asc" }],
    }),
    prisma.race.count({ where }),
  ]);

  return NextResponse.json({
    races,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
