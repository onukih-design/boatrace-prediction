import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status"); // active, blocked, all

  const where: any = {};
  if (search) {
    where.OR = [
      { displayName: { contains: search } },
      { lineUserId: { contains: search } },
    ];
  }
  if (status === "active") where.isActive = true;
  if (status === "blocked") where.isBlocked = true;

  const [users, total] = await Promise.all([
    prisma.lineUser.findMany({
      where,
      include: {
        settings: true,
        _count: { select: { notifications: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.lineUser.count({ where }),
  ]);

  return NextResponse.json({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
