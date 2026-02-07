import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "hot";

    let orderBy: Record<string, string>;
    switch (sort) {
      case "new":
        orderBy = { createdAt: "desc" };
        break;
      case "top":
        orderBy = { score: "desc" };
        break;
      default:
        orderBy = { score: "desc" };
    }

    const posts = await prisma.post.findMany({
      where: { groupId: parseInt(id) },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy,
    });

    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

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
    const { title, content, link } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        link: link || null,
        userId: payload.userId,
        groupId: parseInt(id),
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
