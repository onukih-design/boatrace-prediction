import {
  messagingApi,
  WebhookEvent,
  TextMessage,
  FlexMessage,
  FlexBubble,
} from "@line/bot-sdk";
import { prisma } from "@/lib/prisma";

// LINE Messaging APIクライアント
const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

const client = new messagingApi.MessagingApiClient({
  channelAccessToken,
});

// ========================================
// Webhook イベント処理
// ========================================
export async function handleWebhookEvent(event: WebhookEvent) {
  switch (event.type) {
    case "follow":
      await handleFollow(event.source.userId!);
      break;
    case "unfollow":
      await handleUnfollow(event.source.userId!);
      break;
    case "message":
      if (event.message.type === "text") {
        await handleTextMessage(
          event.source.userId!,
          event.message.text,
          event.replyToken
        );
      }
      break;
  }
}

// ========================================
// 友だち追加処理
// ========================================
async function handleFollow(lineUserId: string) {
  // プロフィール取得
  let profile;
  try {
    profile = await client.getProfile(lineUserId);
  } catch {
    profile = null;
  }

  // ユーザー登録/復帰
  await prisma.lineUser.upsert({
    where: { lineUserId },
    update: {
      isActive: true,
      isBlocked: false,
      displayName: profile?.displayName,
      pictureUrl: profile?.pictureUrl,
      statusMessage: profile?.statusMessage,
      lastActiveAt: new Date(),
    },
    create: {
      lineUserId,
      displayName: profile?.displayName,
      pictureUrl: profile?.pictureUrl,
      statusMessage: profile?.statusMessage,
      settings: {
        create: {},
      },
    },
  });

  // ウェルカムメッセージ
  await client.pushMessage({
    to: lineUserId,
    messages: [
      {
        type: "text",
        text: "友だち追加ありがとうございます！\n\n競艇予想AIがレース情報と予想をお届けします。\n\nコマンド一覧:\n・「今日の予想」- 本日の予想一覧\n・「結果」- 直近の的中結果\n・「設定」- 通知設定\n・「ヘルプ」- 使い方",
      } as TextMessage,
    ],
  });
}

// ========================================
// ブロック（友だち解除）処理
// ========================================
async function handleUnfollow(lineUserId: string) {
  await prisma.lineUser.update({
    where: { lineUserId },
    data: { isActive: false, isBlocked: true },
  });
}

// ========================================
// テキストメッセージ処理
// ========================================
async function handleTextMessage(
  lineUserId: string,
  text: string,
  replyToken: string
) {
  // ユーザー最終アクティブ更新
  await prisma.lineUser.update({
    where: { lineUserId },
    data: { lastActiveAt: new Date() },
  });

  const normalizedText = text.trim();

  if (
    normalizedText.includes("今日") &&
    normalizedText.includes("予想")
  ) {
    await replyTodayPredictions(replyToken);
  } else if (normalizedText.includes("結果")) {
    await replyRecentResults(replyToken);
  } else if (normalizedText.includes("設定")) {
    await replySettings(replyToken, lineUserId);
  } else if (normalizedText.includes("ヘルプ")) {
    await replyHelp(replyToken);
  } else {
    await client.replyMessage({
      replyToken,
      messages: [
        {
          type: "text",
          text: "コマンド一覧:\n・「今日の予想」\n・「結果」\n・「設定」\n・「ヘルプ」",
        } as TextMessage,
      ],
    });
  }
}

// ========================================
// 今日の予想返信
// ========================================
async function replyTodayPredictions(replyToken: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const predictions = await prisma.prediction.findMany({
    where: {
      race: { raceDate: today },
      rank: { lte: 3 },
    },
    include: {
      race: { include: { venue: true } },
    },
    orderBy: [
      { race: { venueId: "asc" } },
      { race: { raceNumber: "asc" } },
      { rank: "asc" },
    ],
    take: 60,
  });

  if (predictions.length === 0) {
    await client.replyMessage({
      replyToken,
      messages: [
        {
          type: "text",
          text: "本日の予想データはまだありません。\nレース開始前に配信します。",
        } as TextMessage,
      ],
    });
    return;
  }

  // レースごとにグループ化
  const grouped = predictions.reduce(
    (acc, pred) => {
      const key = `${pred.race.venue.name} ${pred.race.raceNumber}R`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(pred);
      return acc;
    },
    {} as Record<string, typeof predictions>
  );

  let text = "【本日の予想】\n\n";
  for (const [raceKey, preds] of Object.entries(grouped).slice(0, 10)) {
    text += `${raceKey}\n`;
    for (const p of preds) {
      text += `  ${p.rank}位予想: ${p.lane}号艇 (スコア: ${(p.score * 100).toFixed(1)})\n`;
    }
    text += "\n";
  }

  await client.replyMessage({
    replyToken,
    messages: [{ type: "text", text } as TextMessage],
  });
}

// ========================================
// 直近結果返信
// ========================================
async function replyRecentResults(replyToken: string) {
  const recentHits = await prisma.hitSummary.findMany({
    orderBy: { targetDate: "desc" },
    take: 7,
  });

  if (recentHits.length === 0) {
    await client.replyMessage({
      replyToken,
      messages: [
        {
          type: "text",
          text: "的中データはまだありません。",
        } as TextMessage,
      ],
    });
    return;
  }

  let text = "【直近の的中結果】\n\n";
  for (const hit of recentHits) {
    const dateStr = hit.targetDate.toLocaleDateString("ja-JP");
    text += `${dateStr}: ${hit.hitCount}/${hit.predictedRaces}的中 (${(hit.hitRate * 100).toFixed(1)}%)\n`;
  }

  await client.replyMessage({
    replyToken,
    messages: [{ type: "text", text } as TextMessage],
  });
}

// ========================================
// 設定メニュー返信
// ========================================
async function replySettings(replyToken: string, lineUserId: string) {
  const user = await prisma.lineUser.findUnique({
    where: { lineUserId },
    include: { settings: true },
  });

  const settings = user?.settings;
  let text = "【通知設定】\n\n";
  text += `レース前通知: ${settings?.notifyBeforeRace ? "ON" : "OFF"}\n`;
  text += `結果通知: ${settings?.notifyResult ? "ON" : "OFF"}\n`;
  text += `上位予想通知: ${settings?.notifyTopPicks ? "ON" : "OFF"}\n`;
  text += `\nお気に入り場: ${settings?.favoriteVenues || "未設定"}\n`;
  text += `\n設定変更はWebページから行えます。`;

  await client.replyMessage({
    replyToken,
    messages: [{ type: "text", text } as TextMessage],
  });
}

// ========================================
// ヘルプ返信
// ========================================
async function replyHelp(replyToken: string) {
  await client.replyMessage({
    replyToken,
    messages: [
      {
        type: "text",
        text: "【ボートレース予想AI】\n\n使い方:\n・「今日の予想」- 本日の全場予想を表示\n・「結果」- 直近7日間の的中結果\n・「設定」- 通知設定を確認\n・「ヘルプ」- この画面を表示\n\n毎朝自動で予想を配信します。\nレース確定後に結果もお知らせします。",
      } as TextMessage,
    ],
  });
}

// ========================================
// 予想結果を全ユーザーに配信
// ========================================
export async function broadcastPredictions(
  predictions: Array<{
    venue: string;
    raceNumber: number;
    topPicks: Array<{
      rank: number;
      lane: number;
      racerName: string;
      score: number;
    }>;
  }>
) {
  const activeUsers = await prisma.lineUser.findMany({
    where: { isActive: true, isBlocked: false },
    include: { settings: true },
  });

  let text = "【本日の予想】\n\n";
  for (const pred of predictions.slice(0, 15)) {
    text += `${pred.venue} ${pred.raceNumber}R\n`;
    for (const pick of pred.topPicks) {
      text += `  ${pick.rank}位: ${pick.lane}号艇 ${pick.racerName}\n`;
    }
    text += "\n";
  }

  let sentCount = 0;
  for (const user of activeUsers) {
    if (!user.settings?.notifyTopPicks) continue;

    try {
      await client.pushMessage({
        to: user.lineUserId,
        messages: [{ type: "text", text } as TextMessage],
      });

      await prisma.deliveryLog.create({
        data: {
          lineUserId: user.id,
          messageType: "prediction",
          content: text,
          status: "sent",
        },
      });

      sentCount++;
    } catch (error) {
      await prisma.deliveryLog.create({
        data: {
          lineUserId: user.id,
          messageType: "prediction",
          content: text,
          status: "failed",
        },
      });
    }
  }

  return { sentCount, totalUsers: activeUsers.length };
}
