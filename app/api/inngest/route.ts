import { NextResponse } from "next/server";

/**
 * Inngest Endpoint Stub
 *
 * This is a placeholder endpoint that prevents 404 errors when the Inngest
 * Dev Server tries to discover functions during development.
 *
 * When you're ready to activate Inngest (Phase v0.2), replace this with:
 * - Import Inngest client from `inngest/client.ts`
 * - Import all function handlers
 * - Use `serve()` to register functions
 *
 * For now, this returns an empty response to stop the 404 spam.
 */

export async function GET() {
  return NextResponse.json(
    {
      message: "Inngest endpoint (stub - not active yet)",
      functions: [],
    },
    { status: 200 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      message: "Inngest endpoint (stub - not active yet)",
      functions: [],
    },
    { status: 200 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      message: "Inngest endpoint (stub - not active yet)",
      functions: [],
    },
    { status: 200 }
  );
}
