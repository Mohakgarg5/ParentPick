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
      const res = NextResponse.json({ error: "User not found" }, { status: 404 });
      res.cookies.set("token", "", { maxAge: 0, path: "/" });
      return res;
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

    const { name, children, concerns, situations, contentPrefs } = await request.json();

    // Update user name
    if (name) {
      await prisma.user.update({
        where: { id: payload.userId },
        data: { name },
      });
    }

    // Update children: delete existing and recreate
    if (children && Array.isArray(children)) {
      await prisma.child.deleteMany({ where: { userId: payload.userId } });

      for (const child of children) {
        if (child.name && child.dateOfBirth) {
          await prisma.child.create({
            data: {
              userId: payload.userId,
              name: child.name,
              dateOfBirth: new Date(child.dateOfBirth),
            },
          });
        }
      }

      // Update legacy fields from first child
      if (children.length > 0 && children[0].name && children[0].dateOfBirth) {
        const firstAge = calculateAge(children[0].dateOfBirth);
        await prisma.user.update({
          where: { id: payload.userId },
          data: { childName: children[0].name, childAge: firstAge },
        });
      }
    }

    // Update preferences
    if (concerns !== undefined || situations !== undefined || contentPrefs !== undefined) {
      await prisma.userPreferences.upsert({
        where: { userId: payload.userId },
        create: {
          userId: payload.userId,
          concerns: JSON.stringify(concerns || []),
          situations: JSON.stringify(situations || []),
          contentPrefs: JSON.stringify(contentPrefs || []),
        },
        update: {
          ...(concerns !== undefined && { concerns: JSON.stringify(concerns) }),
          ...(situations !== undefined && { situations: JSON.stringify(situations) }),
          ...(contentPrefs !== undefined && { contentPrefs: JSON.stringify(contentPrefs) }),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
