import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { childName, childAge, concerns, situations, contentPrefs } = await request.json();

    if (!childName || !childAge) {
      return NextResponse.json({ error: "Child name and age are required" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        childName,
        childAge: parseInt(childAge),
        onboardingComplete: true,
      },
    });

    await prisma.userPreferences.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        concerns: JSON.stringify(concerns || []),
        situations: JSON.stringify(situations || []),
        contentPrefs: JSON.stringify(contentPrefs || []),
      },
      update: {
        concerns: JSON.stringify(concerns || []),
        situations: JSON.stringify(situations || []),
        contentPrefs: JSON.stringify(contentPrefs || []),
      },
    });

    // Auto-join the matching age group
    const age = parseInt(childAge);
    const matchingGroup = await prisma.group.findFirst({
      where: { ageMin: { lte: age }, ageMax: { gte: age } },
    });

    if (matchingGroup) {
      await prisma.groupMember.upsert({
        where: {
          userId_groupId: { userId: payload.userId, groupId: matchingGroup.id },
        },
        create: { userId: payload.userId, groupId: matchingGroup.id },
        update: {},
      });
      await prisma.group.update({
        where: { id: matchingGroup.id },
        data: { memberCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
