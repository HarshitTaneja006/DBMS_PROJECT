import { NextResponse } from "next/server";
import { getStudentDetail, getFacultyDetail, getCourseDetail } from "../../../../../lib/lookup";

// GET /api/detail/student/1001 | /api/detail/faculty/301 | /api/detail/course/401
export async function GET(_req, { params }) {
  const { kind, id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    let data = null;
    if (kind === "student") data = await getStudentDetail(numId);
    else if (kind === "faculty") data = await getFacultyDetail(numId);
    else if (kind === "course") data = await getCourseDetail(numId);
    else return NextResponse.json({ error: "Unknown kind" }, { status: 404 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ kind, id: numId, data });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
