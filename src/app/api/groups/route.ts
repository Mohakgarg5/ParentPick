import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      orderBy: { ageMin: "asc" },
      include: {
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({ groups });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
