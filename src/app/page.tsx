import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const payload = await getCurrentUser();

  if (!payload) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user?.onboardingComplete) {
    redirect("/onboarding");
  }

  redirect("/discover");
}
