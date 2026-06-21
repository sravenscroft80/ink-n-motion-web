import { NextResponse } from "next/server";
import { bootstrapAuthenticatedUser } from "@/lib/auth/bootstrap-user";
import { getAuthCallbackRedirectPath } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_failed", requestUrl.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_failed", requestUrl.origin),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await bootstrapAuthenticatedUser(user.id);
    } catch (bootstrapError) {
      console.error("Auth bootstrap error:", bootstrapError);
    }
  }

  const redirectPath = getAuthCallbackRedirectPath(requestUrl.searchParams);
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
}
