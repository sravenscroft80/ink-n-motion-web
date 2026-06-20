import { cookies } from "next/headers";

export const CREDITS_COOKIE = "ink_credits";
export const DEFAULT_CREDITS = 3;
export const CHECKOUT_CREDIT_PACK = 10;

export async function getCredits(): Promise<number> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CREDITS_COOKIE)?.value;

  if (raw === undefined) {
    return DEFAULT_CREDITS;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : DEFAULT_CREDITS;
}

export async function setCredits(amount: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CREDITS_COOKIE, String(Math.max(0, amount)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function deductCredit(): Promise<boolean> {
  return deductCredits(1);
}

export async function deductCredits(amount: number): Promise<boolean> {
  if (amount <= 0) {
    return true;
  }

  const current = await getCredits();
  if (current < amount) {
    return false;
  }

  await setCredits(current - amount);
  return true;
}

export async function addCredits(amount: number): Promise<number> {
  const current = await getCredits();
  const next = current + amount;
  await setCredits(next);
  return next;
}
