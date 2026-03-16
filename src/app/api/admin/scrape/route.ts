import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fetchAndSaveAll } from "@/lib/scraper/openapi-client";

// スクレイピングジョブ一覧
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await prisma.scrapeJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ jobs });
}

// データ取得実行（Boatrace Open API）
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const targetDate = body.date ? new Date(body.date) : undefined;

  // ジョブ登録
  const job = await prisma.scrapeJob.create({
    data: {
      jobType: "openapi_fetch",
      targetDate: targetDate || new Date(),
      status: "running",
      startedAt: new Date(),
    },
  });

  try {
    // Open APIからデータ取得・保存
    const result = await fetchAndSaveAll(targetDate);

    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        result: JSON.stringify(result),
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: `データ取得完了: ${result.racesCreated}レース, ${result.entriesCreated}エントリー, ${result.resultsUpdated}件結果更新`,
      ...result,
    });
  } catch (error) {
    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "unknown",
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      { error: "データ取得に失敗しました", detail: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}
