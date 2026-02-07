import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ageMin = searchParams.get("ageMin");
    const ageMax = searchParams.get("ageMax");
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");

    const where: Record<string, unknown> = {};

    if (ageMin && ageMax) {
      where.ageMin = { lte: parseInt(ageMax) };
      where.ageMax = { gte: parseInt(ageMin) };
    }

    if (category) {
      where.category = category;
    }

    const videos = await prisma.video.findMany({
      where,
      orderBy: { parentRating: "desc" },
    });

    let filtered = videos;
    if (tag) {
      filtered = videos.filter((v) => {
        const tags: string[] = JSON.parse(v.tags);
        return tags.includes(tag);
      });
    }

    return NextResponse.json({ videos: filtered });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
