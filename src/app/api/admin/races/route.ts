import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // TODO: 本番環境では認証を有効にする
  // const admin = await requireAdmin(request);
  // if (!admin) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const date = searchParams.get("date");
  const venueCode = searchParams.get("venue");

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
        entries: {
          include: { racer: true, motor: true },
          orderBy: { lane: "asc" },
        },
        predictions: { orderBy: { rank: "asc" } },
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
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
