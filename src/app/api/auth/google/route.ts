import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json({ error: "Missing credential" }, { status: 400 });
    }

    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.email_verified) {
      return NextResponse.json({ error: "Invalid Google account" }, { status: 401 });
    }

    const { sub: googleId, email, name } = payload;
    let isNewUser = false;

    // Case 1: Returning Google user
    let user = await prisma.user.findUnique({ where: { googleId: googleId! } });

    if (!user) {
      // Case 2: Existing user with same email — link Google account
      user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleId! },
        });
      } else {
        // Case 3: Brand new user
        user = await prisma.user.create({
          data: {
            name: name || email.split("@")[0],
            email,
            googleId: googleId!,
            onboardingComplete: false,
          },
        });
        isNewUser = true;
      }
    }

    const reviewCount = await prisma.review.count({
      where: { userId: user.id, feedbackCompleted: true },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      onboardingComplete: user.onboardingComplete,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboardingComplete: user.onboardingComplete,
        reviewCount,
        isNewUser,
      },
    });

    setAuthCookie(response, token);
    return response;
  } catch {
    return NextResponse.json({ error: "Google sign-in failed" }, { status: 500 });
  }
}
