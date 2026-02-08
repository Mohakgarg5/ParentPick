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

    // Verify the user exists in DB (JWT may have stale userId after re-seed)
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please log out and log back in." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const videoId = parseInt(id);
    const { educationalRating, ageAppropriateRating, engagementRating, stimulationRating, overallRating, contentTags } =
      await request.json();

    for (const r of [educationalRating, ageAppropriateRating, engagementRating, stimulationRating, overallRating]) {
      if (!r || r < 1 || r > 5) {
        return NextResponse.json(
          { error: "All ratings must be between 1 and 5" },
          { status: 400 }
        );
      }
    }

    // Use findUnique + create/update instead of upsert for better compatibility
    const existing = await prisma.review.findUnique({
      where: {
        userId_videoId: { userId: payload.userId, videoId },
      },
    });

    const parsedContentTags = JSON.stringify(contentTags || []);

    if (existing) {
      await prisma.review.update({
        where: { id: existing.id },
        data: {
          educationalRating,
          ageAppropriateRating,
          engagementRating,
          stimulationRating,
          overallRating,
          rating: overallRating,
          contentTags: parsedContentTags,
          feedbackCompleted: true,
        },
      });
    } else {
      await prisma.review.create({
        data: {
          userId: payload.userId,
          videoId,
          rating: overallRating,
          comment: "",
          helpfulTags: "[]",
          contentTags: parsedContentTags,
          educationalRating,
          ageAppropriateRating,
          engagementRating,
          stimulationRating,
          overallRating,
          feedbackCompleted: true,
        },
      });
    }

    const allReviews = await prisma.review.findMany({
      where: { videoId },
      select: { rating: true, overallRating: true, stimulationRating: true },
    });

    const total = allReviews.reduce(
      (sum, r) => sum + (r.overallRating ?? r.rating),
      0
    );
    const avg = allReviews.length > 0 ? total / allReviews.length : 0;

    const stimReviews = allReviews.filter((r) => r.stimulationRating != null);
    const stimTotal = stimReviews.reduce((sum, r) => sum + (r.stimulationRating ?? 0), 0);
    const stimAvg = stimReviews.length > 0 ? stimTotal / stimReviews.length : null;

    await prisma.video.update({
      where: { id: videoId },
      data: {
        parentRating: avg,
        reviewCount: allReviews.length,
        stimulationLevel: stimAvg,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Feedback POST error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
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
