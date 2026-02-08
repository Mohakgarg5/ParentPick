import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/age";

export async function POST(request: NextRequest) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { children, concerns, situations, contentPrefs } = await request.json();

    if (!children || children.length === 0) {
      return NextResponse.json({ error: "Please add at least one child" }, { status: 400 });
    }

    for (const child of children) {
      if (!child.name || !child.dateOfBirth) {
        return NextResponse.json({ error: "Each child needs a name and date of birth" }, { status: 400 });
      }
    }

    // Create children records
    for (const child of children) {
      await prisma.child.create({
        data: {
          userId: payload.userId,
          name: child.name,
          dateOfBirth: new Date(child.dateOfBirth),
        },
      });
    }

    // Keep legacy fields populated with first child's data for backward compatibility
    const firstChild = children[0];
    const firstAge = calculateAge(firstChild.dateOfBirth);

    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        childName: firstChild.name,
        childAge: firstAge,
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

    // Auto-join matching age groups for all children
    const ages = children.map((c: { dateOfBirth: string }) => calculateAge(c.dateOfBirth));
    const uniqueAges = [...new Set(ages)] as number[];

    for (const age of uniqueAges) {
      const matchingGroup = await prisma.group.findFirst({
        where: { ageMin: { lte: age }, ageMax: { gte: age } },
      });

      if (matchingGroup) {
        const existing = await prisma.groupMember.findUnique({
          where: {
            userId_groupId: { userId: payload.userId, groupId: matchingGroup.id },
          },
        });

        if (!existing) {
          await prisma.groupMember.create({
            data: { userId: payload.userId, groupId: matchingGroup.id },
          });
          await prisma.group.update({
            where: { id: matchingGroup.id },
            data: { memberCount: { increment: 1 } },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
