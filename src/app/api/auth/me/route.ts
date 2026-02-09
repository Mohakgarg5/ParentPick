import { NextResponse } from "next/server";
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
        onboardingComplete: true,
        preferences: true,
        children: {
          orderBy: { dateOfBirth: "asc" },
        },
        groupMemberships: { include: { group: true } },
      },
    });

    if (!user) {
      // Clear stale token cookie if user no longer exists
      const res = NextResponse.json({ error: "User not found" }, { status: 404 });
      res.cookies.set("token", "", { maxAge: 0, path: "/" });
      return res;
    }

    // Add calculated ages to children
    const childrenWithAge = user.children.map((child) => ({
      ...child,
      age: calculateAge(child.dateOfBirth),
    }));

    return NextResponse.json({
      user: {
        ...user,
        children: childrenWithAge,
      },
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
