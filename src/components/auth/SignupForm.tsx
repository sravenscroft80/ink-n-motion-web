"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AuthShell } from "@/components/auth/AuthShell";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";

function getEmailRedirectUrl(): string {
  if (typeof window === "undefined") {
    return "/auth/callback";
  }
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent("/?auth=confirmed")}`;
}

export function SignupForm() {
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getEmailRedirectUrl(),
        },
      });

      if (signUpError) {
        setError(getAuthErrorMessage(signUpError));
        return;
      }

      if (data.session) {
        window.location.href = "/?auth=confirmed";
        return;
      }

      setAwaitingConfirmation(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (awaitingConfirmation) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="We sent a confirmation link to finish creating your account."
        footer={
          <>
            Already confirmed?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Log in
            </Link>
          </>
        }
      >
        <div className="space-y-4 text-sm text-muted">
          <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-4 text-violet-100">
            <p className="font-medium text-white">Confirm your email to continue</p>
            <p className="mt-2">
              We sent a link to{" "}
              <span className="font-medium text-white">{email.trim()}</span>.
              Click it to activate your account and receive{" "}
              <span className="font-medium text-white">3 free tokens</span>.
            </p>
          </div>
          <p>
            Didn&apos;t get it? Check spam, or wait a minute and try signing up
            again.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Sign up free — 3 tokens included after you confirm your email."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm text-muted">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-white outline-none transition-colors focus:border-accent/50"
            placeholder="you@example.com"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-muted">Password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-white outline-none transition-colors focus:border-accent/50"
            placeholder="At least 6 characters"
          />
        </label>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>
    </AuthShell>
  );
}
