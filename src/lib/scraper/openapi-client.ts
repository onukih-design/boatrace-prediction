import axios from "axios";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

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

// クラス番号→ランク変換
const CLASS_MAP: Record<number, string> = {
  1: "A1",
  2: "A2",
  3: "B1",
  4: "B2",
};

// 場番号→コード変換
function stadiumToCode(stadiumNumber: number): string {
  return String(stadiumNumber).padStart(2, "0");
}

// ========================================
// 出走表データ取得
// ========================================
export async function fetchPrograms(date?: Date): Promise<RaceProgram[]> {
  const url = date
    ? `${BASE_URL}/programs/v2/${format(date, "yyyy")}/${format(date, "yyyyMMdd")}.json`
    : `${BASE_URL}/programs/v2/today.json`;

  try {
    const response = await axios.get(url, { timeout: 30000 });
    return response.data.programs || [];
  } catch (error) {
    console.error(`Failed to fetch programs: ${url}`, error);
    return [];
  }
}

// ========================================
// 結果データ取得
// ========================================
export async function fetchResults(date?: Date): Promise<RaceResult[]> {
  const url = date
    ? `${BASE_URL}/results/v2/${format(date, "yyyy")}/${format(date, "yyyyMMdd")}.json`
    : `${BASE_URL}/results/v2/today.json`;

  try {
    const response = await axios.get(url, { timeout: 30000 });
    return response.data.results || [];
  } catch (error) {
    console.error(`Failed to fetch results: ${url}`, error);
    return [];
  }
}

// ========================================
// 出走表データをDBに保存
// ========================================
export async function saveProgramsToDB(programs: RaceProgram[]) {
  let racesCreated = 0;
  let entriesCreated = 0;

  for (const prog of programs) {
    const venueCode = stadiumToCode(prog.race_stadium_number);
    const raceDate = new Date(prog.race_date);
    raceDate.setHours(0, 0, 0, 0);

    // 競艇場取得
    const venue = await prisma.venue.findUnique({
      where: { code: venueCode },
    });
    if (!venue) continue;

    // レース作成
    const race = await prisma.race.upsert({
      where: {
        raceDate_venueId_raceNumber: {
          raceDate,
          venueId: venue.id,
          raceNumber: prog.race_number,
        },
      },
      update: {
        raceTitle: prog.race_title || prog.race_subtitle || null,
      },
      create: {
        raceDate,
        venueId: venue.id,
        raceNumber: prog.race_number,
        raceTitle: prog.race_title || prog.race_subtitle || null,
      },
    });
    racesCreated++;

    // 各選手のエントリー保存
    for (const boat of prog.boats) {
      if (!boat.racer_number || !boat.racer_boat_number) continue;

      // 勝率計算: 1着率*1 + 2着率で近似的な勝率
      const winRate =
        boat.racer_national_top_1_percent * 0.1 +
        boat.racer_national_top_2_percent * 0.05 +
        boat.racer_national_top_3_percent * 0.02;

      // 選手 upsert
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

      // モーター upsert
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

      // ボート upsert
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

      // エントリー upsert
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

  return { racesCreated, entriesCreated };
}

// ========================================
// 結果データをDBに保存
// ========================================
export async function saveResultsToDB(results: RaceResult[]) {
  let updated = 0;

  for (const res of results) {
    const venueCode = stadiumToCode(res.race_stadium_number);
    const raceDate = new Date(res.race_date);
    raceDate.setHours(0, 0, 0, 0);

    const venue = await prisma.venue.findUnique({
      where: { code: venueCode },
    });
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

    // 天候情報を更新
    await prisma.race.update({
      where: { id: race.id },
      data: {
        windSpeed: res.race_wind || null,
        waveHeight: res.race_wave || null,
      },
    });

    // 着順を更新
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
        updated++;
      } catch {
        // エントリーが存在しない場合はスキップ
      }
    }
  }

  return { updated };
}

// ========================================
// 一括取得: 出走表 + 結果
// ========================================
export async function fetchAndSaveAll(date?: Date) {
  console.log(`[OpenAPI] Fetching data for ${date ? format(date, "yyyy-MM-dd") : "today"}...`);

  // 出走表取得・保存
  const programs = await fetchPrograms(date);
  console.log(`[OpenAPI] Programs fetched: ${programs.length} races`);

  const progResult = await saveProgramsToDB(programs);
  console.log(`[OpenAPI] Programs saved: ${progResult.racesCreated} races, ${progResult.entriesCreated} entries`);

  // 結果取得・保存
  const results = await fetchResults(date);
  console.log(`[OpenAPI] Results fetched: ${results.length} races`);

  const resResult = await saveResultsToDB(results);
  console.log(`[OpenAPI] Results saved: ${resResult.updated} entries updated`);

  return {
    programsCount: programs.length,
    racesCreated: progResult.racesCreated,
    entriesCreated: progResult.entriesCreated,
    resultsCount: results.length,
    resultsUpdated: resResult.updated,
  };
}
