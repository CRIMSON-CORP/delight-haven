import db from "./db";
import { schedules } from "./db/schema";
import { and, eq, gte } from "drizzle-orm";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "http://localhost:5181";
const PORT = Number(process.env.PORT ?? 3000);

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

  return json({
    success: true,
    message: `Thank you, ${full_name}! Your visit is scheduled for ${new Date(visit_date).toLocaleDateString("en-US", { dateStyle: "long" })}. We'll be in touch shortly.`,
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

    if (url.pathname === "/health" && req.method === "GET") {
      return json({ status: "ok", timestamp: new Date().toISOString() });
    }

    return json({ success: false, message: "Not found." }, 404);
  },

  error(err: Error): Response {
    console.error("[server] Unhandled error:", err);
    return json({ success: false, message: "Internal server error." }, 500);
  },
});

console.log(`🚀 Server running at http://localhost:${PORT}`);
