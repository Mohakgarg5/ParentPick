import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const groupId = parseInt(id);

    const existing = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: payload.userId, groupId } },
    });

    if (existing) {
      // Leave group
      await prisma.groupMember.delete({
        where: { userId_groupId: { userId: payload.userId, groupId } },
      });
      await prisma.group.update({
        where: { id: groupId },
        data: { memberCount: { decrement: 1 } },
      });
      return NextResponse.json({ joined: false });
    }

    await prisma.groupMember.create({
      data: { userId: payload.userId, groupId },
    });
    await prisma.group.update({
      where: { id: groupId },
      data: { memberCount: { increment: 1 } },
    });

    return NextResponse.json({ joined: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
