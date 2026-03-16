import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { broadcastPredictions } from "@/lib/line/client";
import { generateDailyPredictions } from "@/lib/prediction/engine";

// 配信ログ一覧
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const [logs, total] = await Promise.all([
    prisma.deliveryLog.findMany({
      include: { lineUser: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { sentAt: "desc" },
    }),
    prisma.deliveryLog.count(),
  ]);

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// 手動配信トリガー
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 予想生成
    const predictions = await generateDailyPredictions(today);

    // LINE配信
    const result = await broadcastPredictions(predictions);

    return NextResponse.json({
      success: true,
      message: `${result.sentCount}/${result.totalUsers}ユーザーに配信完了`,
      predictions: predictions.length,
    });
  } catch (error) {
    console.error("Delivery error:", error);
    return NextResponse.json(
      { error: "Delivery failed" },
      { status: 500 }
    );
  }
}
