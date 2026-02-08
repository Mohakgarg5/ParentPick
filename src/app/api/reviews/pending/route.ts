import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const reviewCount = await prisma.review.count({
      where: { userId: payload.userId, feedbackCompleted: true },
    });

    // Get videos the user hasn't reviewed yet, matching their child's age
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { childAge: true },
    });

    const reviewedVideoIds = await prisma.review.findMany({
      where: { userId: payload.userId },
      select: { videoId: true },
    });

    const reviewedIds = reviewedVideoIds.map((r) => r.videoId);

    const where: Record<string, unknown> = {};
    if (reviewedIds.length > 0) {
      where.id = { notIn: reviewedIds };
    }
    if (user?.childAge) {
      where.ageMin = { lte: user.childAge };
      where.ageMax = { gte: user.childAge };
    }

    const unreviewedVideos = await prisma.video.findMany({
      where,
      orderBy: { parentRating: "desc" },
      take: 8,
    });

    return NextResponse.json({
      reviewCount,
      needsReviews: reviewCount < 3,
      unreviewedVideos,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
