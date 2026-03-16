import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// 全24競艇場
const VENUES = [
  { code: "01", name: "桐生", prefecture: "群馬県" },
  { code: "02", name: "戸田", prefecture: "埼玉県" },
  { code: "03", name: "江戸川", prefecture: "東京都" },
  { code: "04", name: "平和島", prefecture: "東京都" },
  { code: "05", name: "多摩川", prefecture: "東京都" },
  { code: "06", name: "浜名湖", prefecture: "静岡県" },
  { code: "07", name: "蒲郡", prefecture: "愛知県" },
  { code: "08", name: "常滑", prefecture: "愛知県" },
  { code: "09", name: "津", prefecture: "三重県" },
  { code: "10", name: "三国", prefecture: "福井県" },
  { code: "11", name: "びわこ", prefecture: "滋賀県" },
  { code: "12", name: "住之江", prefecture: "大阪府" },
  { code: "13", name: "尼崎", prefecture: "兵庫県" },
  { code: "14", name: "鳴門", prefecture: "徳島県" },
  { code: "15", name: "丸亀", prefecture: "香川県" },
  { code: "16", name: "児島", prefecture: "岡山県" },
  { code: "17", name: "宮島", prefecture: "広島県" },
  { code: "18", name: "徳山", prefecture: "山口県" },
  { code: "19", name: "下関", prefecture: "山口県" },
  { code: "20", name: "若松", prefecture: "福岡県" },
  { code: "21", name: "芦屋", prefecture: "福岡県" },
  { code: "22", name: "福岡", prefecture: "福岡県" },
  { code: "23", name: "唐津", prefecture: "佐賀県" },
  { code: "24", name: "大村", prefecture: "長崎県" },
];

// サンプル選手データ
const SAMPLE_RACERS = [
  { registrationNo: "4320", name: "峰 竜太", rank: "A1", branch: "佐賀", winRate: 8.53, biaxialRate: 56.2, triaxialRate: 72.1 },
  { registrationNo: "4444", name: "桐生 順平", rank: "A1", branch: "埼玉", winRate: 7.89, biaxialRate: 51.3, triaxialRate: 68.5 },
  { registrationNo: "4586", name: "毒島 誠", rank: "A1", branch: "群馬", winRate: 7.76, biaxialRate: 49.8, triaxialRate: 66.7 },
  { registrationNo: "3946", name: "白井 英治", rank: "A1", branch: "山口", winRate: 7.45, biaxialRate: 47.2, triaxialRate: 63.1 },
  { registrationNo: "4024", name: "井口 佳典", rank: "A1", branch: "三重", winRate: 7.32, biaxialRate: 45.6, triaxialRate: 61.8 },
  { registrationNo: "3941", name: "池田 浩二", rank: "A1", branch: "愛知", winRate: 7.28, biaxialRate: 44.9, triaxialRate: 60.5 },
  { registrationNo: "4477", name: "石野 貴之", rank: "A1", branch: "大阪", winRate: 7.15, biaxialRate: 43.7, triaxialRate: 59.2 },
  { registrationNo: "3780", name: "瓜生 正義", rank: "A1", branch: "福岡", winRate: 7.01, biaxialRate: 42.1, triaxialRate: 57.8 },
  { registrationNo: "4238", name: "守田 俊介", rank: "A1", branch: "滋賀", winRate: 6.88, biaxialRate: 40.5, triaxialRate: 56.3 },
  { registrationNo: "4337", name: "馬場 貴也", rank: "A1", branch: "滋賀", winRate: 7.55, biaxialRate: 48.1, triaxialRate: 64.2 },
  { registrationNo: "4190", name: "西山 貴浩", rank: "A1", branch: "福岡", winRate: 7.22, biaxialRate: 44.3, triaxialRate: 60.1 },
  { registrationNo: "3960", name: "菊地 孝平", rank: "A1", branch: "静岡", winRate: 6.95, biaxialRate: 41.8, triaxialRate: 57.2 },
  { registrationNo: "4013", name: "田村 隆信", rank: "A2", branch: "徳島", winRate: 6.45, biaxialRate: 38.2, triaxialRate: 53.1 },
  { registrationNo: "4050", name: "山口 剛", rank: "A2", branch: "広島", winRate: 6.32, biaxialRate: 36.8, triaxialRate: 51.5 },
  { registrationNo: "4100", name: "鈴木 博", rank: "B1", branch: "東京", winRate: 5.45, biaxialRate: 28.5, triaxialRate: 42.3 },
  { registrationNo: "4200", name: "佐藤 翼", rank: "B1", branch: "埼玉", winRate: 5.12, biaxialRate: 25.8, triaxialRate: 39.7 },
  { registrationNo: "4300", name: "高橋 遼", rank: "B1", branch: "千葉", winRate: 4.88, biaxialRate: 23.2, triaxialRate: 37.1 },
  { registrationNo: "4400", name: "渡辺 光", rank: "B2", branch: "神奈川", winRate: 3.95, biaxialRate: 18.5, triaxialRate: 28.6 },
];

async function main() {
  console.log("Seeding database...");

  // 競艇場マスタ
  for (const venue of VENUES) {
    await prisma.venue.upsert({
      where: { code: venue.code },
      update: {},
      create: venue,
    });
  }
  console.log(`  ✓ ${VENUES.length} venues created`);

  // 管理者アカウント
  const adminPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "admin123",
    12
  );
  await prisma.admin.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@example.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@example.com",
      password: adminPassword,
      name: "管理者",
      role: "super_admin",
    },
  });
  console.log("  ✓ Admin account created");

  // サンプル選手データ
  for (const racer of SAMPLE_RACERS) {
    await prisma.racer.upsert({
      where: { registrationNo: racer.registrationNo },
      update: { winRate: racer.winRate, biaxialRate: racer.biaxialRate, triaxialRate: racer.triaxialRate },
      create: racer,
    });
  }
  console.log(`  ✓ ${SAMPLE_RACERS.length} sample racers created`);

  // サンプルレースデータ（今日分）
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const venues = await prisma.venue.findMany({ take: 3 }); // 3場分
  const racers = await prisma.racer.findMany({ take: 18 }); // 18選手（3場×6選手）

  for (let vi = 0; vi < venues.length; vi++) {
    const venue = venues[vi];
    for (let rn = 1; rn <= 3; rn++) {
      // 各場3レース
      const race = await prisma.race.upsert({
        where: {
          raceDate_venueId_raceNumber: {
            raceDate: today,
            venueId: venue.id,
            raceNumber: rn,
          },
        },
        update: {},
        create: {
          raceDate: today,
          venueId: venue.id,
          raceNumber: rn,
        },
      });

      // 6選手をエントリー
      for (let lane = 1; lane <= 6; lane++) {
        const racerIdx = vi * 6 + (lane - 1);
        if (racerIdx >= racers.length) break;
        const racer = racers[racerIdx];

        await prisma.raceEntry.upsert({
          where: {
            raceId_lane: { raceId: race.id, lane },
          },
          update: {},
          create: {
            raceId: race.id,
            lane,
            racerId: racer.id,
            weight: 51 + Math.random() * 5,
            exhibitionTime: 6.5 + Math.random() * 0.3,
          },
        });
      }
    }
  }
  console.log("  ✓ Sample race data created (3 venues x 3 races)");

  console.log("\nSeed completed successfully!");
  console.log("  Admin login: admin@example.com / admin123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
