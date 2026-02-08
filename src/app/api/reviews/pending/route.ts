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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { childAge: true },
    });

    const reviewedVideoIds = await prisma.review.findMany({
      where: { userId: payload.userId },
      select: { videoId: true },
    });

    const reviewedIds = reviewedVideoIds.map((r) => r.videoId);

    // First: get videos the user watched but hasn't reviewed
    const watchedUnreviewed = await prisma.videoView.findMany({
      where: {
        userId: payload.userId,
        videoId: reviewedIds.length > 0 ? { notIn: reviewedIds } : undefined,
      },
      include: {
        video: true,
      },
      orderBy: { watchedAt: "desc" },
      take: 8,
    });

    const watchedVideos = watchedUnreviewed.map((v) => v.video);

    // If we don't have enough watched videos, fill with age-matched unreviewed ones
    let fillVideos: typeof watchedVideos = [];
    if (watchedVideos.length < 8) {
      const excludeIds = [...reviewedIds, ...watchedVideos.map((v) => v.id)];
      const where: Record<string, unknown> = {};
      if (excludeIds.length > 0) {
        where.id = { notIn: excludeIds };
      }
      if (user?.childAge) {
        where.ageMin = { lte: user.childAge };
        where.ageMax = { gte: user.childAge };
      }

      fillVideos = await prisma.video.findMany({
        where,
        orderBy: { parentRating: "desc" },
        take: 8 - watchedVideos.length,
      });
    }

    return NextResponse.json({
      reviewCount,
      needsReviews: reviewCount < 3,
      unreviewedVideos: [...watchedVideos, ...fillVideos],
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
