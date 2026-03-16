import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { handleWebhookEvent } from "@/lib/line/client";

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";

// LINE Webhook署名検証
function validateSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac("SHA256", CHANNEL_SECRET)
    .update(body)
    .digest("base64");
  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-line-signature") || "";

    // 署名検証
    if (!validateSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const parsed = JSON.parse(body);
    const events = parsed.events || [];

    // 各イベントを処理
    await Promise.all(
      events.map((event: any) => handleWebhookEvent(event))
    );

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
