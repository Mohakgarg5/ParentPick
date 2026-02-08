import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        comment: { not: "" },
      },
      include: {
        user: { select: { id: true, name: true } },
        video: {
          select: {
            id: true,
            title: true,
            youtubeId: true,
            channelName: true,
            ageMin: true,
            ageMax: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
