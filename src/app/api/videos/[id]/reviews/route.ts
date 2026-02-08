import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please log out and log back in." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const videoId = parseInt(id);
    const { rating, comment, helpfulTags } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const review = await prisma.review.upsert({
      where: {
        userId_videoId: { userId: payload.userId, videoId },
      },
      create: {
        userId: payload.userId,
        videoId,
        rating,
        comment: comment || "",
        helpfulTags: JSON.stringify(helpfulTags || []),
      },
      update: {
        rating,
        comment: comment || "",
        helpfulTags: JSON.stringify(helpfulTags || []),
      },
      include: { user: { select: { id: true, name: true } } },
    });

    // Update video aggregate rating (prefer overallRating from feedback)
    const allReviews = await prisma.review.findMany({
      where: { videoId },
      select: { rating: true, overallRating: true },
    });

    const total = allReviews.reduce(
      (sum, r) => sum + (r.overallRating ?? r.rating),
      0
    );
    const avg = allReviews.length > 0 ? total / allReviews.length : 0;

    await prisma.video.update({
      where: { id: videoId },
      data: {
        parentRating: avg,
        reviewCount: allReviews.length,
      },
    });

    return NextResponse.json({ review });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
