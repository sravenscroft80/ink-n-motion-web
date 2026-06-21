import { HomePage } from "@/components/HomePage";
import { getCredits } from "@/lib/credits";

interface PageProps {
  searchParams: Promise<{
    checkout?: string;
    credits?: string;
    auth?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialCredits = await getCredits();

  let initialToast: string | null = null;

  if (params.checkout === "success") {
    initialToast = params.credits
      ? `Checkout complete — ${params.credits} credits added.`
      : "Checkout complete — credits added.";
  } else if (params.checkout === "cancelled") {
    initialToast = "Checkout cancelled.";
  } else if (params.checkout === "failed") {
    initialToast = "Checkout could not be verified. Please try again.";
  } else if (params.auth === "confirmed") {
    initialToast =
      "Welcome! Your email is confirmed — 3 free tokens are in your account.";
  }

  return (
    <HomePage initialCredits={initialCredits} initialToast={initialToast} />
  );
}
