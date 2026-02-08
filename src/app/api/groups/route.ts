import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      orderBy: { ageMin: "asc" },
      include: {
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({ groups });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { name, description, ageMin, ageMax, icon } = await request.json();

    if (!name || !description || !ageMin || !ageMax) {
      return NextResponse.json({ error: "Name, description, and age range are required" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    const existing = await prisma.group.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A community with a similar name already exists" }, { status: 400 });
    }

    const group = await prisma.group.create({
      data: {
        name,
        slug,
        description,
        ageMin: parseInt(ageMin),
        ageMax: parseInt(ageMax),
        icon: icon || "👶",
        memberCount: 1,
      },
    });

    // Auto-join the creator
    await prisma.groupMember.create({
      data: { userId: payload.userId, groupId: group.id },
    });

    return NextResponse.json({ group });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
