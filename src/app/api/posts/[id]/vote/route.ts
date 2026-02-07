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
    const postId = parseInt(id);
    const { value } = await request.json();

    if (value !== 1 && value !== -1) {
      return NextResponse.json({ error: "Invalid vote value" }, { status: 400 });
    }

    const existing = await prisma.vote.findUnique({
      where: { userId_postId: { userId: payload.userId, postId } },
    });

    if (existing) {
      if (existing.value === value) {
        // Remove vote
        await prisma.vote.delete({
          where: { userId_postId: { userId: payload.userId, postId } },
        });
        const update = value === 1 ? { upvotes: { decrement: 1 }, score: { decrement: 1 } } : { downvotes: { decrement: 1 }, score: { increment: 1 } };
        const post = await prisma.post.update({ where: { id: postId }, data: update });
        return NextResponse.json({ post, userVote: 0 });
      } else {
        // Change vote
        await prisma.vote.update({
          where: { userId_postId: { userId: payload.userId, postId } },
          data: { value },
        });
        const update =
          value === 1
            ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 }, score: { increment: 2 } }
            : { upvotes: { decrement: 1 }, downvotes: { increment: 1 }, score: { decrement: 2 } };
        const post = await prisma.post.update({ where: { id: postId }, data: update });
        return NextResponse.json({ post, userVote: value });
      }
    }

    // New vote
    await prisma.vote.create({
      data: { userId: payload.userId, postId, value },
    });
    const update = value === 1 ? { upvotes: { increment: 1 }, score: { increment: 1 } } : { downvotes: { increment: 1 }, score: { decrement: 1 } };
    const post = await prisma.post.update({ where: { id: postId }, data: update });
    return NextResponse.json({ post, userVote: value });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
