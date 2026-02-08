import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/age";

export async function GET() {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        childName: true,
        childAge: true,
        preferences: true,
        children: { orderBy: { dateOfBirth: "asc" } },
        groupMemberships: { include: { group: true } },
        _count: { select: { reviews: true, posts: true, comments: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const childrenWithAge = user.children.map((child) => ({
      ...child,
      age: calculateAge(child.dateOfBirth),
    }));

    return NextResponse.json({
      user: { ...user, children: childrenWithAge },
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { childName, childAge } = await request.json();

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        ...(childName !== undefined && { childName }),
        ...(childAge !== undefined && { childAge: parseInt(childAge) }),
      },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
