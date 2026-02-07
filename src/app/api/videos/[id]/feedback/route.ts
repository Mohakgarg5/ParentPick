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

    const { id } = await params;
    const videoId = parseInt(id);
    const { educationalRating, ageAppropriateRating, engagementRating, overallRating } =
      await request.json();

    for (const r of [educationalRating, ageAppropriateRating, engagementRating, overallRating]) {
      if (!r || r < 1 || r > 5) {
        return NextResponse.json(
          { error: "All ratings must be between 1 and 5" },
          { status: 400 }
        );
      }
    }

    await prisma.review.upsert({
      where: {
        userId_videoId: { userId: payload.userId, videoId },
      },
      create: {
        userId: payload.userId,
        videoId,
        rating: overallRating,
        comment: "",
        helpfulTags: "[]",
        educationalRating,
        ageAppropriateRating,
        engagementRating,
        overallRating,
        feedbackCompleted: true,
      },
      update: {
        educationalRating,
        ageAppropriateRating,
        engagementRating,
        overallRating,
        rating: overallRating,
        feedbackCompleted: true,
      },
    });

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

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ feedbackCompleted: false });
    }

    const { id } = await params;
    const videoId = parseInt(id);

    const review = await prisma.review.findUnique({
      where: {
        userId_videoId: { userId: payload.userId, videoId },
      },
      select: { feedbackCompleted: true },
    });

    return NextResponse.json({
      feedbackCompleted: review?.feedbackCompleted ?? false,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
