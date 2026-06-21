import { HomePage } from "@/components/HomePage";

interface PageProps {
  searchParams: Promise<{
    checkout?: string;
    auth?: string;
    purchase?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  let initialToast: string | null = null;
  let refreshTokensOnMount = false;

  if (params.purchase === "success") {
    initialToast =
      "Thanks for your purchase! Tokens are added automatically — refresh if your balance hasn’t updated yet.";
    refreshTokensOnMount = true;
  } else if (params.checkout === "success") {
    initialToast = "Checkout complete.";
  } else if (params.checkout === "cancelled") {
    initialToast = "Checkout cancelled.";
  } else if (params.checkout === "failed") {
    initialToast = "Checkout could not be verified. Please try again.";
  } else if (params.auth === "confirmed") {
    initialToast =
      "Welcome! Your email is confirmed — 3 free tokens are in your account.";
  }

  return (
    <HomePage
      initialToast={initialToast}
      refreshTokensOnMount={refreshTokensOnMount}
    />
  );
}
