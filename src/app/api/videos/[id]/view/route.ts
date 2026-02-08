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
    const body = await request.json().catch(() => ({}));
    const completed = body.completed === true;

    const existing = await prisma.videoView.findUnique({
      where: {
        userId_videoId: { userId: payload.userId, videoId },
      },
    });

    if (existing) {
      await prisma.videoView.update({
        where: { id: existing.id },
        data: {
          watchedAt: new Date(),
          completed: existing.completed || completed,
        },
      });
    } else {
      await prisma.videoView.create({
        data: {
          userId: payload.userId,
          videoId,
          completed,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
