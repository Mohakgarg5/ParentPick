import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function getResend() {
  const { Resend } = require("resend") as typeof import("resend");
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Always return success to prevent email enumeration
    const successResponse = {
      message: "If an account with that email exists, we sent a reset link.",
    };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(successResponse);
    }

    // Google-only users can't reset password
    if (!user.passwordHash) {
      return NextResponse.json(successResponse);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // Send email
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

    const resend = getResend();
    await resend.emails.send({
      from: "ParentPick <onboarding@resend.dev>",
      to: email,
      subject: "Reset your ParentPick password",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0d9488;">ParentPick</h2>
          <p>Hi ${user.name},</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetLink}" style="display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
          <p style="color: #64748b; font-size: 14px; margin-top: 24px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json(successResponse);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
