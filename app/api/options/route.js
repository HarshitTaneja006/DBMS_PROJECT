import { NextResponse } from "next/server";
import { getOptions } from "../../../lib/lookup";

// GET /api/options?table=STUDENT -> { options: [{ value, label }] }
// Used for foreign-key dropdowns in CRUD forms.
export async function GET(req) {
  const table = new URL(req.url).searchParams.get("table");
  try {
    const options = await getOptions(table);
    return NextResponse.json({ table, options });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 400 });
  }
}
