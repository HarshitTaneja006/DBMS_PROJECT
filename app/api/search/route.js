import { NextResponse } from "next/server";
import { searchAll } from "../../../lib/lookup";

// GET /api/search?q=arav&scope=all|student|faculty|course
export async function GET(req) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const scope = url.searchParams.get("scope") || "all";
  try {
    const results = await searchAll(q, scope);
    return NextResponse.json({ q, scope, ...results });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
