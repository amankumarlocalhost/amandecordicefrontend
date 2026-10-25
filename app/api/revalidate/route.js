import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

// Called by the backend (server to server) right after an admin publishes a change, with the cache
// tags that changed. REVALIDATE_SECRET is a server-only variable shared with the backend; it is never
// exposed to the browser. Tags are expired immediately so the next visitor gets fresh data.

const TAG = /^[a-z]+(:[a-z0-9._-]{1,200})?$/i;

function authorized(header) {
  const secret = process.env.REVALIDATE_SECRET || "";
  if (secret.length < 32 || typeof header !== "string") return false;
  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  if (!authorized(request.headers.get("x-revalidate-secret"))) {
    return Response.json({ revalidated: false, message: "Unauthorized" }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ revalidated: false, message: "Invalid JSON" }, { status: 400 });
  }
  const tags = Array.isArray(body?.tags) ? [...new Set(body.tags.filter((t) => typeof t === "string" && TAG.test(t)))].slice(0, 100) : [];
  if (!tags.length) return Response.json({ revalidated: false, message: "No valid tags" }, { status: 400 });
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: true, tags, now: Date.now() });
}
