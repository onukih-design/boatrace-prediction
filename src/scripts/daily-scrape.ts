import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { format } from "date-fns";

const prisma = new PrismaClient();

const BASE_URL = "https://boatraceopenapi.github.io";

// ========================================
// 型定義
// ========================================
interface BoatProgram {
  racer_boat_number: number;
  racer_name: string;
  racer_number: number;
  racer_class_number: number;
  racer_branch_number: number;
  racer_age: number;
  racer_weight: number;
  racer_flying_count: number;
  racer_late_count: number;
  racer_average_start_timing: number;
  racer_national_top_1_percent: number;
  racer_national_top_2_percent: number;
  racer_national_top_3_percent: number;
  racer_local_top_1_percent: number;
  racer_local_top_2_percent: number;
  racer_local_top_3_percent: number;
  racer_assigned_motor_number: number;
  racer_assigned_motor_top_2_percent: number;
  racer_assigned_motor_top_3_percent: number;
  racer_assigned_boat_number: number;
  racer_assigned_boat_top_2_percent: number;
  racer_assigned_boat_top_3_percent: number;
}

interface RaceProgram {
  race_date: string;
  race_stadium_number: number;
  race_number: number;
  race_closed_at: string;
  race_grade_number: number;
  race_title: string;
  race_subtitle: string;
  race_distance: number;
  boats: BoatProgram[];
}

interface BoatResult {
  racer_boat_number: number;
  racer_course_number: number;
  racer_start_timing: number;
  racer_place_number: number;
  racer_number: number;
  racer_name: string;
}

interface RaceResult {
  race_date: string;
  race_stadium_number: number;
  race_number: number;
  race_wind: number;
  race_wind_direction_number: number;
  race_wave: number;
  race_weather_number: number;
  race_temperature: number;
  race_water_temperature: number;
  boats: BoatResult[];
}

const CLASS_MAP: Record<number, string> = {
  1: "A1",
  2: "A2",
  3: "B1",
  4: "B2",
};

function stadiumToCode(stadiumNumber: number): string {
  return String(stadiumNumber).padStart(2, "0");
}

// ========================================
// スコアリング重み定義
// ========================================
const WEIGHTS = {
  racerWinRate: 0.25,
  racerBiaxialRate: 0.10,
  racerTriaxialRate: 0.05,
  motorBiaxialRate: 0.15,
  boatBiaxialRate: 0.05,
  courseAdvantage: 0.20,
  rankBonus: 0.10,
  exhibitionTime: 0.05,
  startTiming: 0.05,
};

const COURSE_WIN_RATES: Record<number, number> = {
  1: 0.55, 2: 0.15, 3: 0.12, 4: 0.10, 5: 0.05, 6: 0.03,
};

const RANK_BONUS: Record<string, number> = {
  A1: 1.0, A2: 0.7, B1: 0.4, B2: 0.1,
};

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

  factors.racerWinRate = (entry.racerWinRate / 10) * WEIGHTS.racerWinRate;
  factors.racerBiaxialRate = (entry.racerBiaxialRate / 100) * WEIGHTS.racerBiaxialRate;
  factors.racerTriaxialRate = (entry.racerTriaxialRate / 100) * WEIGHTS.racerTriaxialRate;
  factors.motorBiaxialRate = (entry.motorBiaxialRate / 100) * WEIGHTS.motorBiaxialRate;
  factors.boatBiaxialRate = (entry.boatBiaxialRate / 100) * WEIGHTS.boatBiaxialRate;
  factors.courseAdvantage = (COURSE_WIN_RATES[entry.lane] || 0.03) * WEIGHTS.courseAdvantage;
  factors.rankBonus = (RANK_BONUS[entry.racerRank] || 0.1) * WEIGHTS.rankBonus;

  if (entry.exhibitionTime && entry.exhibitionTime > 0) {
    const normalized = Math.max(0, Math.min(1, (6.8 - entry.exhibitionTime) / 0.4));
    factors.exhibitionTime = normalized * WEIGHTS.exhibitionTime;
  } else {
    factors.exhibitionTime = 0;
  }

  if (entry.avgStartTiming !== null && entry.avgStartTiming >= 0) {
    const normalized = Math.max(0, Math.min(1, (0.2 - entry.avgStartTiming) / 0.2));
    factors.startTiming = normalized * WEIGHTS.startTiming;
  } else {
    factors.startTiming = 0;
  }

  const totalScore = Object.values(factors).reduce((sum, v) => sum + v, 0);
  return { totalScore, factors };
}

// ========================================
// メイン処理
// ========================================
async function main() {
  console.log("========================================");
  console.log("Boatrace Data Fetch & Prediction Script");
  console.log("========================================");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log(`\nTarget date: ${format(today, "yyyy-MM-dd")}`);

  // ========================================
  // Step 1: 出走表データ取得
  // ========================================
  console.log("\n--- Step 1: Fetching programs (出走表) ---");
  const progUrl = `${BASE_URL}/programs/v2/today.json`;
  console.log(`URL: ${progUrl}`);

  let programs: RaceProgram[] = [];
  try {
    const resp = await axios.get(progUrl, { timeout: 30000 });
    programs = resp.data.programs || [];
    console.log(`Programs fetched: ${programs.length} races`);
  } catch (err) {
    console.error("Failed to fetch programs:", err);
    process.exit(1);
  }

  // ========================================
  // Step 2: 出走表をDBに保存
  // ========================================
  console.log("\n--- Step 2: Saving programs to DB ---");
  let racesCreated = 0;
  let entriesCreated = 0;

  for (const prog of programs) {
    const venueCode = stadiumToCode(prog.race_stadium_number);
    const raceDate = new Date(prog.race_date);
    raceDate.setHours(0, 0, 0, 0);

    const venue = await prisma.venue.findUnique({ where: { code: venueCode } });
    if (!venue) {
      console.log(`  Venue not found: code=${venueCode}, skipping`);
      continue;
    }

    const race = await prisma.race.upsert({
      where: {
        raceDate_venueId_raceNumber: {
          raceDate,
          venueId: venue.id,
          raceNumber: prog.race_number,
        },
      },
      update: { raceTitle: prog.race_title || prog.race_subtitle || null },
      create: {
        raceDate,
        venueId: venue.id,
        raceNumber: prog.race_number,
        raceTitle: prog.race_title || prog.race_subtitle || null,
      },
    });
    racesCreated++;

    for (const boat of prog.boats) {
      if (!boat.racer_number || !boat.racer_boat_number) continue;

      const winRate =
        boat.racer_national_top_1_percent * 0.1 +
        boat.racer_national_top_2_percent * 0.05 +
        boat.racer_national_top_3_percent * 0.02;

      const racer = await prisma.racer.upsert({
        where: { registrationNo: String(boat.racer_number) },
        update: {
          name: boat.racer_name,
          rank: CLASS_MAP[boat.racer_class_number] || "B2",
          winRate: parseFloat(winRate.toFixed(2)),
          biaxialRate: boat.racer_national_top_2_percent || 0,
          triaxialRate: boat.racer_national_top_3_percent || 0,
        },
        create: {
          registrationNo: String(boat.racer_number),
          name: boat.racer_name,
          rank: CLASS_MAP[boat.racer_class_number] || "B2",
          winRate: parseFloat(winRate.toFixed(2)),
          biaxialRate: boat.racer_national_top_2_percent || 0,
          triaxialRate: boat.racer_national_top_3_percent || 0,
        },
      });

      let motor = null;
      if (boat.racer_assigned_motor_number) {
        motor = await prisma.motor.upsert({
          where: {
            motorNo_venueId: {
              motorNo: String(boat.racer_assigned_motor_number),
              venueId: venue.id,
            },
          },
          update: {
            biaxialRate: boat.racer_assigned_motor_top_2_percent || 0,
            triaxialRate: boat.racer_assigned_motor_top_3_percent || 0,
          },
          create: {
            motorNo: String(boat.racer_assigned_motor_number),
            venueId: venue.id,
            biaxialRate: boat.racer_assigned_motor_top_2_percent || 0,
            triaxialRate: boat.racer_assigned_motor_top_3_percent || 0,
          },
        });
      }

      let boatRecord = null;
      if (boat.racer_assigned_boat_number) {
        boatRecord = await prisma.boat.upsert({
          where: {
            boatNo_venueId: {
              boatNo: String(boat.racer_assigned_boat_number),
              venueId: venue.id,
            },
          },
          update: {
            biaxialRate: boat.racer_assigned_boat_top_2_percent || 0,
            triaxialRate: boat.racer_assigned_boat_top_3_percent || 0,
          },
          create: {
            boatNo: String(boat.racer_assigned_boat_number),
            venueId: venue.id,
            biaxialRate: boat.racer_assigned_boat_top_2_percent || 0,
            triaxialRate: boat.racer_assigned_boat_top_3_percent || 0,
          },
        });
      }

      await prisma.raceEntry.upsert({
        where: {
          raceId_lane: { raceId: race.id, lane: boat.racer_boat_number },
        },
        update: {
          racerId: racer.id,
          motorId: motor?.id || null,
          boatId: boatRecord?.id || null,
          weight: boat.racer_weight || null,
          startTiming: boat.racer_average_start_timing || null,
        },
        create: {
          raceId: race.id,
          lane: boat.racer_boat_number,
          racerId: racer.id,
          motorId: motor?.id || null,
          boatId: boatRecord?.id || null,
          weight: boat.racer_weight || null,
          startTiming: boat.racer_average_start_timing || null,
        },
      });
      entriesCreated++;
    }
  }

  console.log(`Programs saved: ${racesCreated} races, ${entriesCreated} entries`);

  // ========================================
  // Step 3: 結果データ取得
  // ========================================
  console.log("\n--- Step 3: Fetching results (結果) ---");
  const resUrl = `${BASE_URL}/results/v2/today.json`;
  console.log(`URL: ${resUrl}`);

  let results: RaceResult[] = [];
  try {
    const resp = await axios.get(resUrl, { timeout: 30000 });
    results = resp.data.results || [];
    console.log(`Results fetched: ${results.length} races`);
  } catch (err) {
    console.error("Failed to fetch results:", err);
  }

  // ========================================
  // Step 4: 結果データをDBに保存
  // ========================================
  if (results.length > 0) {
    console.log("\n--- Step 4: Saving results to DB ---");
    let resultsUpdated = 0;

    for (const res of results) {
      const venueCode = stadiumToCode(res.race_stadium_number);
      const raceDate = new Date(res.race_date);
      raceDate.setHours(0, 0, 0, 0);

      const venue = await prisma.venue.findUnique({ where: { code: venueCode } });
      if (!venue) continue;

      const race = await prisma.race.findUnique({
        where: {
          raceDate_venueId_raceNumber: {
            raceDate,
            venueId: venue.id,
            raceNumber: res.race_number,
          },
        },
      });
      if (!race) continue;

      await prisma.race.update({
        where: { id: race.id },
        data: {
          windSpeed: res.race_wind || null,
          waveHeight: res.race_wave || null,
        },
      });

      for (const boat of res.boats) {
        if (!boat.racer_boat_number || !boat.racer_place_number) continue;
        try {
          await prisma.raceEntry.update({
            where: {
              raceId_lane: { raceId: race.id, lane: boat.racer_boat_number },
            },
            data: {
              result: boat.racer_place_number,
              startTiming: boat.racer_start_timing || null,
            },
          });
          resultsUpdated++;
        } catch {
          // skip
        }
      }
    }
    console.log(`Results saved: ${resultsUpdated} entries updated`);
  }

  // ========================================
  // Step 5: 予想生成
  // ========================================
  console.log("\n--- Step 5: Generating predictions ---");

  const races = await prisma.race.findMany({
    where: { raceDate: today },
    include: {
      venue: true,
      entries: {
        include: {
          racer: true,
          motor: true,
          boat: true,
        },
      },
    },
  });

  console.log(`Found ${races.length} races for today`);

  let predictionCount = 0;
  const predictionSummary: Array<{
    venue: string;
    raceNumber: number;
    top3: Array<{ rank: number; lane: number; name: string; score: string }>;
  }> = [];

  for (const race of races) {
    if (race.entries.length === 0) continue;

    const scoredEntries = race.entries.map((entry) => {
      const entryData: EntryData = {
        lane: entry.lane,
        racerWinRate: entry.racer.winRate,
        racerBiaxialRate: entry.racer.biaxialRate,
        racerTriaxialRate: entry.racer.triaxialRate,
        racerRank: entry.racer.rank || "B2",
        motorBiaxialRate: entry.motor?.biaxialRate || 0,
        boatBiaxialRate: entry.boat?.biaxialRate || 0,
        exhibitionTime: entry.exhibitionTime,
        avgStartTiming: entry.startTiming,
      };

      const { totalScore, factors } = calculateScore(entryData);

      return {
        lane: entry.lane,
        racerName: entry.racer.name,
        registrationNo: entry.racer.registrationNo,
        totalScore,
        factors,
      };
    });

    scoredEntries.sort((a, b) => b.totalScore - a.totalScore);

    const predictions = scoredEntries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    for (const pred of predictions) {
      await prisma.prediction.upsert({
        where: {
          raceId_lane: { raceId: race.id, lane: pred.lane },
        },
        update: {
          score: pred.totalScore,
          rank: pred.rank,
          factors: JSON.stringify(pred.factors),
        },
        create: {
          raceId: race.id,
          lane: pred.lane,
          score: pred.totalScore,
          rank: pred.rank,
          factors: JSON.stringify(pred.factors),
        },
      });
      predictionCount++;
    }

    // 的中判定
    const firstPlace = race.entries.find((e) => e.result === 1);
    if (firstPlace) {
      for (const pred of predictions) {
        const entry = race.entries.find((e) => e.lane === pred.lane);
        const isHit = pred.rank === 1 && entry?.result === 1;
        await prisma.prediction.updateMany({
          where: { raceId: race.id, lane: pred.lane },
          data: { isHit },
        });
      }
    }

    predictionSummary.push({
      venue: race.venue.name,
      raceNumber: race.raceNumber,
      top3: predictions.slice(0, 3).map((p) => ({
        rank: p.rank,
        lane: p.lane,
        name: p.racerName,
        score: (p.totalScore * 100).toFixed(1) + "%",
      })),
    });
  }

  console.log(`Predictions generated: ${predictionCount} entries`);

  // ========================================
  // Step 6: サマリ表示
  // ========================================
  console.log("\n========================================");
  console.log("Summary");
  console.log("========================================");
  console.log(`Date: ${format(today, "yyyy-MM-dd")}`);
  console.log(`Races: ${racesCreated}`);
  console.log(`Entries: ${entriesCreated}`);
  console.log(`Results updated: ${results.length > 0 ? "Yes" : "No results available"}`);
  console.log(`Predictions: ${predictionCount}`);

  console.log("\n--- Top 3 Predictions per Race ---");
  for (const item of predictionSummary) {
    console.log(`\n${item.venue} ${item.raceNumber}R:`);
    for (const pick of item.top3) {
      console.log(`  ${pick.rank}位: ${pick.lane}号艇 ${pick.name} (${pick.score})`);
    }
  }

  // ========================================
  // Step 7: 的中集計
  // ========================================
  const totalPredictions = await prisma.prediction.count({
    where: {
      race: { raceDate: today },
      rank: 1,
    },
  });
  const hitPredictions = await prisma.prediction.count({
    where: {
      race: { raceDate: today },
      rank: 1,
      isHit: true,
    },
  });

  if (totalPredictions > 0) {
    const hitRate = ((hitPredictions / totalPredictions) * 100).toFixed(1);
    console.log(`\n--- Hit Rate ---`);
    console.log(`Top pick hits: ${hitPredictions}/${totalPredictions} (${hitRate}%)`);

    // 的中サマリー保存
    await prisma.hitSummary.upsert({
      where: { targetDate: today },
      update: {
        totalRaces: races.length,
        predictedRaces: predictionSummary.length,
        hitCount: hitPredictions,
        hitRate: parseFloat(hitRate),
        topPickHits: hitPredictions,
      },
      create: {
        targetDate: today,
        totalRaces: races.length,
        predictedRaces: predictionSummary.length,
        hitCount: hitPredictions,
        hitRate: parseFloat(hitRate),
        topPickHits: hitPredictions,
      },
    });
  }

  console.log("\n========================================");
  console.log("Done!");
  console.log("========================================");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
