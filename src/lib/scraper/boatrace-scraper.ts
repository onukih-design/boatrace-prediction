import axios from "axios";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

const BASE_URL = process.env.BOATRACE_BASE_URL || "https://www.boatrace.jp";
const DELAY_MS = 2000; // リクエスト間隔（サーバー負荷軽減）

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ========================================
// レース一覧取得
// ========================================
export async function scrapeRaceList(date: Date, venueCode: string) {
  const dateStr = format(date, "yyyyMMdd");
  const url = `${BASE_URL}/owpc/pc/race/racelist?hd=${dateStr}&jcd=${venueCode}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BoatRacePrediction/1.0; research purpose)",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const races: Array<{
      raceNumber: number;
      raceTitle: string;
      deadline: string;
    }> = [];

    // レース情報を解析
    $(".table1 tbody tr").each((_i, el) => {
      const raceNumber = parseInt($(el).find("td:first-child").text().trim());
      const raceTitle = $(el).find(".is-fs14").text().trim();
      const deadline = $(el).find(".is-pT10").text().trim();

      if (raceNumber >= 1 && raceNumber <= 12) {
        races.push({ raceNumber, raceTitle, deadline });
      }
    });

    return races;
  } catch (error) {
    console.error(`Failed to scrape race list: ${url}`, error);
    throw error;
  }
}

// ========================================
// 出走表（番組表）取得
// ========================================
export async function scrapeRaceProgram(
  date: Date,
  venueCode: string,
  raceNumber: number
) {
  const dateStr = format(date, "yyyyMMdd");
  const rno = String(raceNumber).padStart(2, "0");
  const url = `${BASE_URL}/owpc/pc/race/racelist?rno=${rno}&jcd=${venueCode}&hd=${dateStr}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BoatRacePrediction/1.0; research purpose)",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const entries: Array<{
      lane: number;
      registrationNo: string;
      racerName: string;
      rank: string;
      branch: string;
      winRate: number;
      biaxialRate: number;
      motorNo: string;
      motorBiaxialRate: number;
      boatNo: string;
      boatBiaxialRate: number;
      weight: number;
    }> = [];

    // 出走表テーブルから各選手情報を解析
    $(".table1 tbody").each((_i, tbody) => {
      $(tbody)
        .find("tr")
        .each((_j, tr) => {
          const tds = $(tr).find("td");
          if (tds.length < 3) return;

          const lane = parseInt($(tds[0]).text().trim());
          if (lane < 1 || lane > 6) return;

          const registrationNo = $(tds[2]).find(".is-fs18").text().trim();
          const racerName = $(tds[2]).find(".is-fs18").next().text().trim();
          const rank = $(tds[2]).find(".is-fs12").first().text().trim();
          const branch = $(tds[2]).find(".is-fs12").last().text().trim();

          const winRate = parseFloat($(tds[4]).text().trim()) || 0;
          const biaxialRate = parseFloat($(tds[5]).text().trim()) || 0;

          const motorNo = $(tds[6]).text().trim();
          const motorBiaxialRate = parseFloat($(tds[7]).text().trim()) || 0;
          const boatNo = $(tds[8]).text().trim();
          const boatBiaxialRate = parseFloat($(tds[9]).text().trim()) || 0;
          const weight = parseFloat($(tds[3]).text().trim()) || 0;

          entries.push({
            lane,
            registrationNo,
            racerName,
            rank,
            branch,
            winRate,
            biaxialRate,
            motorNo,
            motorBiaxialRate,
            boatNo,
            boatBiaxialRate,
            weight,
          });
        });
    });

    return entries;
  } catch (error) {
    console.error(`Failed to scrape race program: ${url}`, error);
    throw error;
  }
}

// ========================================
// レース結果取得
// ========================================
export async function scrapeRaceResult(
  date: Date,
  venueCode: string,
  raceNumber: number
) {
  const dateStr = format(date, "yyyyMMdd");
  const rno = String(raceNumber).padStart(2, "0");
  const url = `${BASE_URL}/owpc/pc/race/raceresult?rno=${rno}&jcd=${venueCode}&hd=${dateStr}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BoatRacePrediction/1.0; research purpose)",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const results: Array<{
      lane: number;
      result: number;
      raceTime: string;
      startTiming: number;
    }> = [];

    // 結果テーブル解析
    $(".table1 tbody tr").each((_i, tr) => {
      const tds = $(tr).find("td");
      if (tds.length < 3) return;

      const result = parseInt($(tds[0]).text().trim());
      const lane = parseInt($(tds[1]).text().trim());
      const raceTime = $(tds[3]).text().trim();
      const startTiming = parseFloat($(tds[4]).text().trim()) || 0;

      if (result >= 1 && result <= 6 && lane >= 1 && lane <= 6) {
        results.push({ lane, result, raceTime, startTiming });
      }
    });

    return results;
  } catch (error) {
    console.error(`Failed to scrape race result: ${url}`, error);
    throw error;
  }
}

// ========================================
// データをDBに保存
// ========================================
export async function saveRaceDataToDB(
  date: Date,
  venueCode: string,
  raceNumber: number,
  programData: Awaited<ReturnType<typeof scrapeRaceProgram>>,
  resultData?: Awaited<ReturnType<typeof scrapeRaceResult>>
) {
  // 競艇場を取得/作成
  const venue = await prisma.venue.findUnique({
    where: { code: venueCode },
  });
  if (!venue) throw new Error(`Venue not found: ${venueCode}`);

  // レースを作成
  const race = await prisma.race.upsert({
    where: {
      raceDate_venueId_raceNumber: {
        raceDate: date,
        venueId: venue.id,
        raceNumber,
      },
    },
    update: {},
    create: {
      raceDate: date,
      venueId: venue.id,
      raceNumber,
    },
  });

  // 出走表データを保存
  for (const entry of programData) {
    // 選手を作成/更新
    const racer = await prisma.racer.upsert({
      where: { registrationNo: entry.registrationNo },
      update: {
        name: entry.racerName,
        rank: entry.rank,
        branch: entry.branch,
        winRate: entry.winRate,
        biaxialRate: entry.biaxialRate,
      },
      create: {
        registrationNo: entry.registrationNo,
        name: entry.racerName,
        rank: entry.rank,
        branch: entry.branch,
        winRate: entry.winRate,
        biaxialRate: entry.biaxialRate,
      },
    });

    // モーターを作成/更新
    let motor = null;
    if (entry.motorNo) {
      motor = await prisma.motor.upsert({
        where: {
          motorNo_venueId: { motorNo: entry.motorNo, venueId: venue.id },
        },
        update: { biaxialRate: entry.motorBiaxialRate },
        create: {
          motorNo: entry.motorNo,
          venueId: venue.id,
          biaxialRate: entry.motorBiaxialRate,
        },
      });
    }

    // ボートを作成/更新
    let boat = null;
    if (entry.boatNo) {
      boat = await prisma.boat.upsert({
        where: {
          boatNo_venueId: { boatNo: entry.boatNo, venueId: venue.id },
        },
        update: { biaxialRate: entry.boatBiaxialRate },
        create: {
          boatNo: entry.boatNo,
          venueId: venue.id,
          biaxialRate: entry.boatBiaxialRate,
        },
      });
    }

    // レースエントリーを保存
    await prisma.raceEntry.upsert({
      where: {
        raceId_lane: { raceId: race.id, lane: entry.lane },
      },
      update: {
        racerId: racer.id,
        motorId: motor?.id,
        boatId: boat?.id,
        weight: entry.weight,
      },
      create: {
        raceId: race.id,
        lane: entry.lane,
        racerId: racer.id,
        motorId: motor?.id,
        boatId: boat?.id,
        weight: entry.weight,
      },
    });
  }

  // レース結果を保存
  if (resultData) {
    for (const res of resultData) {
      await prisma.raceEntry.update({
        where: {
          raceId_lane: { raceId: race.id, lane: res.lane },
        },
        data: {
          result: res.result,
          raceTime: res.raceTime,
          startTiming: res.startTiming,
        },
      });
    }
  }

  return race;
}

// ========================================
// 日次バッチ: 指定日の全場データ取得
// ========================================
export async function scrapeDailyData(date: Date, venueCodes: string[]) {
  const results: Array<{ venueCode: string; races: number; status: string }> =
    [];

  for (const venueCode of venueCodes) {
    try {
      const raceList = await scrapeRaceList(date, venueCode);
      let racesProcessed = 0;

      for (const race of raceList) {
        await sleep(DELAY_MS);

        const program = await scrapeRaceProgram(
          date,
          venueCode,
          race.raceNumber
        );
        if (program.length > 0) {
          await sleep(DELAY_MS);
          let raceResult;
          try {
            raceResult = await scrapeRaceResult(
              date,
              venueCode,
              race.raceNumber
            );
          } catch {
            // 結果未確定の場合はスキップ
          }
          await saveRaceDataToDB(
            date,
            venueCode,
            race.raceNumber,
            program,
            raceResult
          );
          racesProcessed++;
        }
      }

      results.push({
        venueCode,
        races: racesProcessed,
        status: "completed",
      });
    } catch (error) {
      results.push({
        venueCode,
        races: 0,
        status: `failed: ${error instanceof Error ? error.message : "unknown"}`,
      });
    }

    await sleep(DELAY_MS);
  }

  return results;
}
