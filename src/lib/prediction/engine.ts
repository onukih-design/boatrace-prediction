import { prisma } from "@/lib/prisma";

// ========================================
// スコアリング重み定義
// ========================================
const WEIGHTS = {
  racerWinRate: 0.25, // 選手勝率
  racerBiaxialRate: 0.10, // 選手2連対率
  racerTriaxialRate: 0.05, // 選手3連対率
  motorBiaxialRate: 0.15, // モーター2連対率
  boatBiaxialRate: 0.05, // ボート2連対率
  courseAdvantage: 0.20, // コース有利度（インコース有利）
  rankBonus: 0.10, // ランクボーナス（A1 > A2 > B1 > B2）
  exhibitionTime: 0.05, // 展示タイム
  startTiming: 0.05, // 平均STタイミング
};

// コース別勝率（統計的インコース有利）
const COURSE_WIN_RATES: Record<number, number> = {
  1: 0.55, // 1コースは約55%の勝率
  2: 0.15,
  3: 0.12,
  4: 0.10,
  5: 0.05,
  6: 0.03,
};

// ランク別ボーナス
const RANK_BONUS: Record<string, number> = {
  A1: 1.0,
  A2: 0.7,
  B1: 0.4,
  B2: 0.1,
};

// ========================================
// 個別スコア計算
// ========================================
interface EntryData {
  lane: number;
  racerWinRate: number;
  racerBiaxialRate: number;
  racerTriaxialRate: number;
  racerRank: string;
  motorBiaxialRate: number;
  boatBiaxialRate: number;
  exhibitionTime: number | null;
  avgStartTiming: number | null;
}

function calculateScore(entry: EntryData): {
  totalScore: number;
  factors: Record<string, number>;
} {
  const factors: Record<string, number> = {};

  // 選手勝率スコア（最大10で正規化）
  factors.racerWinRate = (entry.racerWinRate / 10) * WEIGHTS.racerWinRate;

  // 選手2連対率スコア（最大100%で正規化）
  factors.racerBiaxialRate =
    (entry.racerBiaxialRate / 100) * WEIGHTS.racerBiaxialRate;

  // 選手3連対率スコア
  factors.racerTriaxialRate =
    (entry.racerTriaxialRate / 100) * WEIGHTS.racerTriaxialRate;

  // モーター2連対率スコア
  factors.motorBiaxialRate =
    (entry.motorBiaxialRate / 100) * WEIGHTS.motorBiaxialRate;

  // ボート2連対率スコア
  factors.boatBiaxialRate =
    (entry.boatBiaxialRate / 100) * WEIGHTS.boatBiaxialRate;

  // コース有利度スコア
  factors.courseAdvantage =
    (COURSE_WIN_RATES[entry.lane] || 0.03) * WEIGHTS.courseAdvantage;

  // ランクボーナス
  factors.rankBonus =
    (RANK_BONUS[entry.racerRank] || 0.1) * WEIGHTS.rankBonus;

  // 展示タイムスコア（低いほど良い、6.40〜6.80のレンジで正規化）
  if (entry.exhibitionTime && entry.exhibitionTime > 0) {
    const normalized = Math.max(
      0,
      Math.min(1, (6.8 - entry.exhibitionTime) / 0.4)
    );
    factors.exhibitionTime = normalized * WEIGHTS.exhibitionTime;
  } else {
    factors.exhibitionTime = 0;
  }

  // 平均STタイミング（0.00に近いほど良い、0.00〜0.20のレンジ）
  if (entry.avgStartTiming !== null && entry.avgStartTiming >= 0) {
    const normalized = Math.max(
      0,
      Math.min(1, (0.2 - entry.avgStartTiming) / 0.2)
    );
    factors.startTiming = normalized * WEIGHTS.startTiming;
  } else {
    factors.startTiming = 0;
  }

  const totalScore = Object.values(factors).reduce((sum, v) => sum + v, 0);

  return { totalScore, factors };
}

// ========================================
// レース予想生成
// ========================================
export async function generatePrediction(raceId: number) {
  // レースエントリーと関連データを取得
  const entries = await prisma.raceEntry.findMany({
    where: { raceId },
    include: {
      racer: true,
      motor: true,
      boat: true,
    },
  });

  if (entries.length === 0) {
    throw new Error(`No entries found for race ${raceId}`);
  }

  // 各選手の平均STタイミングを計算（過去データ）
  const scoredEntries = await Promise.all(
    entries.map(async (entry) => {
      // 過去のSTタイミング平均を取得
      const pastEntries = await prisma.raceEntry.findMany({
        where: {
          racerId: entry.racerId,
          startTiming: { not: null },
        },
        select: { startTiming: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      });

      const avgStartTiming =
        pastEntries.length > 0
          ? pastEntries.reduce(
              (sum, e) => sum + (e.startTiming || 0),
              0
            ) / pastEntries.length
          : null;

      const entryData: EntryData = {
        lane: entry.lane,
        racerWinRate: entry.racer.winRate,
        racerBiaxialRate: entry.racer.biaxialRate,
        racerTriaxialRate: entry.racer.triaxialRate,
        racerRank: entry.racer.rank || "B2",
        motorBiaxialRate: entry.motor?.biaxialRate || 0,
        boatBiaxialRate: entry.boat?.biaxialRate || 0,
        exhibitionTime: entry.exhibitionTime,
        avgStartTiming,
      };

      const { totalScore, factors } = calculateScore(entryData);

      return {
        lane: entry.lane,
        racerName: entry.racer.name,
        registrationNo: entry.racer.registrationNo,
        totalScore,
        factors,
      };
    })
  );

  // スコアで降順ソート
  scoredEntries.sort((a, b) => b.totalScore - a.totalScore);

  // ランク付け（1〜6位）
  const predictions = scoredEntries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  // DBに保存
  for (const pred of predictions) {
    await prisma.prediction.upsert({
      where: {
        raceId_lane: { raceId, lane: pred.lane },
      },
      update: {
        score: pred.totalScore,
        rank: pred.rank,
        factors: JSON.stringify(pred.factors),
      },
      create: {
        raceId,
        lane: pred.lane,
        score: pred.totalScore,
        rank: pred.rank,
        factors: JSON.stringify(pred.factors),
      },
    });
  }

  return predictions;
}

// ========================================
// 日次予想バッチ: 指定日の全レース予想
// ========================================
export async function generateDailyPredictions(date: Date) {
  const races = await prisma.race.findMany({
    where: {
      raceDate: date,
    },
    include: {
      venue: true,
      entries: true,
    },
  });

  const results: Array<{
    raceId: number;
    venue: string;
    raceNumber: number;
    topPicks: Array<{ rank: number; lane: number; racerName: string; score: number }>;
  }> = [];

  for (const race of races) {
    if (race.entries.length === 0) continue;

    try {
      const predictions = await generatePrediction(race.id);

      results.push({
        raceId: race.id,
        venue: race.venue.name,
        raceNumber: race.raceNumber,
        topPicks: predictions.slice(0, 3).map((p) => ({
          rank: p.rank,
          lane: p.lane,
          racerName: p.racerName,
          score: Math.round(p.totalScore * 1000) / 1000,
        })),
      });
    } catch (error) {
      console.error(`Failed to generate prediction for race ${race.id}`, error);
    }
  }

  return results;
}

// ========================================
// 的中判定: レース結果が出た後に実行
// ========================================
export async function checkPredictionHits(raceId: number) {
  const predictions = await prisma.prediction.findMany({
    where: { raceId },
    orderBy: { rank: "asc" },
  });

  const entries = await prisma.raceEntry.findMany({
    where: { raceId, result: { not: null } },
  });

  if (entries.length === 0) return null;

  const firstPlace = entries.find((e) => e.result === 1);
  if (!firstPlace) return null;

  let hitCount = 0;
  for (const pred of predictions) {
    const entry = entries.find((e) => e.lane === pred.lane);
    // 予想1位が実際の1位と一致したら的中
    const isHit = pred.rank === 1 && entry?.result === 1;
    if (isHit) hitCount++;

    await prisma.prediction.update({
      where: { id: pred.id },
      data: { isHit },
    });
  }

  return { totalPredictions: predictions.length, hits: hitCount };
}
