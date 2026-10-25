/** Only same-site relative paths are allowed as post-login redirects (prevents open redirects). */
export function safeNext(next, fallback = "/account") {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
