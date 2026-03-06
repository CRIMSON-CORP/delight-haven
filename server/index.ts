import db from "./db";
import { schedules, newsletterSubscribers } from "./db/schema";
import { and, eq, gte } from "drizzle-orm";
import { renderTemplate, sendMail } from "./utils";
import { join } from "path";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "http://localhost:5181";
const PORT = Number(process.env.PORT ?? 3000);
const DIST_DIR = join(import.meta.dir, "../dist");

// ---------------------------------------------------------------------------
// CORS helpers
// ---------------------------------------------------------------------------

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function preflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: corsHeaders(ALLOWED_ORIGIN) });
}

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(ALLOWED_ORIGIN),
    },
  });
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/** POST /api/schedule-date */
async function handleScheduleDate(req: Request): Promise<Response> {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: "Invalid JSON body." }, 400);
  }

  const { full_name, email, phone, visit_date } = body as {
    full_name?: string;
    email?: string;
    phone?: string;
    visit_date?: string;
  };

  // Basic server-side validation
  if (!full_name || !email || !phone || !visit_date) {
    return json({ success: false, message: "All fields are required." }, 422);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return json({ success: false, message: "Please enter a valid email address." }, 422);
  }

  const date = new Date(visit_date);
  if (isNaN(date.getTime()) || date < new Date()) {
    return json({ success: false, message: "Please choose a future visit date." }, 422);
  }

  // Check for an existing active (future) booking for this email
  const todayISO = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  const [existing] = await db
    .select()
    .from(schedules)
    .where(and(eq(schedules.email, email), gte(schedules.visit_date, todayISO)))
    .limit(1);

  if (existing) {
    const existingDateLabel = new Date(existing.visit_date).toLocaleDateString("en-US", {
      dateStyle: "long",
    });
    return json(
      {
        success: false,
        message: `You already have a tour scheduled for ${existingDateLabel}. Please contact us if you need to reschedule.`,
      },
      409,
    );
  }

  // Persist the new booking
  console.log("[schedule-date] New booking:", { full_name, email, phone, visit_date });
  await db.insert(schedules).values({ full_name, email, phone, visit_date });

  sendMail({
    to: email,
    subject: "Schedule!",
    html: await renderTemplate("./templates/schedule-template.html", {
      full_name,
      visit_date,
      email,
      phone,
    }),
  });

  return json({
    success: true,
    message: `Thank you, ${full_name}! Your visit is scheduled for ${new Date(visit_date).toLocaleDateString("en-US", { dateStyle: "long" })}. We'll be in touch shortly.`,
  });
}

/** POST /api/newsletter */
async function handleNewsletter(req: Request): Promise<Response> {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: "Invalid JSON body." }, 400);
  }

  const { email } = body as { email?: string };

  if (!email) {
    return json({ success: false, message: "Email address is required." }, 422);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return json({ success: false, message: "Please enter a valid email address." }, 422);
  }

  // Check for an existing subscriber
  const [existing] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);

  if (existing) {
    return json({ success: false, message: "This email is already subscribed. Thank you!" }, 409);
  }

  await db.insert(newsletterSubscribers).values({ email });
  console.log("[newsletter] New subscriber:", email);

  sendMail({
    to: email,
    subject: "Newsletter",
    html: await renderTemplate("./templates/news-letter-template.html", {
      domain: process.env.DOMAIN,
    }),
  });

  return json({
    success: true,
    message: "You're subscribed! Welcome to the Delight Haven community.",
  });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

Bun.serve({
  port: PORT,

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // Handle CORS preflight for all routes
    const preflightRes = preflight(req);
    if (preflightRes) return preflightRes;

    // Route table
    if (url.pathname === "/api/schedule-date" && req.method === "POST") {
      return handleScheduleDate(req);
    }

    if (url.pathname === "/api/newsletter" && req.method === "POST") {
      return handleNewsletter(req);
    }

    if (url.pathname === "/health" && req.method === "GET") {
      return json({ status: "ok", timestamp: new Date().toISOString() });
    }

    // ---------------------------------------------------------------------------
    // Static file serving from dist/
    // ---------------------------------------------------------------------------
    const rawPath = url.pathname === "/" ? "/index.html" : url.pathname;

    // 1. Exact match  (e.g. /assets/main-abc123.js)
    const exactFile = Bun.file(join(DIST_DIR, rawPath));
    if (await exactFile.exists()) {
      return new Response(exactFile);
    }

    // 2. Try appending .html  (e.g. /about → /about.html)
    const htmlFile = Bun.file(join(DIST_DIR, rawPath + ".html"));
    if (await htmlFile.exists()) {
      return new Response(htmlFile);
    }

    // 3. SPA fallback — let the client-side router handle it
    const indexFile = Bun.file(join(DIST_DIR, "index.html"));
    if (await indexFile.exists()) {
      return new Response(indexFile, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return json({ success: false, message: "Not found." }, 404);
  },

  error(err: Error): Response {
    console.error("[server] Unhandled error:", err);
    return json({ success: false, message: "Internal server error." }, 500);
  },
});

console.log(`🚀 Server running at http://localhost:${PORT}`);
