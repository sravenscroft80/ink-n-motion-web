export function getAuthErrorMessage(error: {
  message?: string;
  code?: string;
}): string {
  const message = error.message?.toLowerCase() ?? "";
  const code = error.code?.toLowerCase() ?? "";

  if (
    message.includes("invalid login credentials") ||
    code === "invalid_credentials"
  ) {
    return "Wrong email or password.";
  }

  if (
    message.includes("email not confirmed") ||
    code === "email_not_confirmed"
  ) {
    return "Please confirm your email before logging in. Check your inbox for the link.";
  }

  if (
    message.includes("user already registered") ||
    code === "user_already_exists"
  ) {
    return "An account with this email already exists. Try logging in instead.";
  }

  if (message.includes("password should be at least")) {
    return "Password must be at least 6 characters.";
  }

  if (message.includes("unable to validate email address")) {
    return "That email address looks invalid.";
  }

  if (message.includes("signup is disabled")) {
    return "Sign up is currently disabled.";
  }

  if (message.includes("rate limit") || code === "over_email_send_rate_limit") {
    return "Too many attempts. Please wait a minute and try again.";
  }

  return error.message ?? "Something went wrong. Please try again.";
}

export function getAuthCallbackRedirectPath(
  searchParams: URLSearchParams,
): string {
  const next = searchParams.get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/?auth=confirmed";
}
