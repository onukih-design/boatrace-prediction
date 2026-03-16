import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const history = await prisma.hitSummary.findMany({
    orderBy: { targetDate: "desc" },
    take: 30,
  });

  return NextResponse.json({ history });
}
