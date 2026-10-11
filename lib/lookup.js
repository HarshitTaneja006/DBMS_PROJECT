import { prisma } from "./prisma";
import { TABLES } from "./tables";

// Server-side only: Prisma-powered lookups for dropdowns, search and detail screens.

export function camel(name) {
  const parts = name.toLowerCase().split("_");
  return parts.map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1))).join("");
}

export function toDelegate(table) {
  return camel(table);
}

function displayCol(def) {
  return (
    def.columns.find((c) => c.name === "Name") ||
    def.columns.find((c) => c.name === "Title") ||
    def.columns.find((c) => !def.pk.includes(c.name))
  );
}

// Dropdown options for a referenced table: [{ value, label }]
export async function getOptions(table) {
  const def = TABLES[table];
  if (!def) throw new Error("Unknown table");
  const orderBy = def.pk.map((k) => ({ [camel(k)]: "asc" }));
  const records = await prisma[toDelegate(table)].findMany({ orderBy, take: 500 });
  const disp = displayCol(def);
  return records.map((r) => {
    const pkVals = def.pk.map((k) => String(r[camel(k)] ?? ""));
    const d = disp ? r[camel(disp.name)] : null;
    const label =
      d !== null && d !== undefined && String(d) !== pkVals[0]
        ? `${pkVals.join(" / ")} - ${d}`
        : pkVals.join(" / ");
    return { value: pkVals[0], label };
  });
}

function num(q) {
  const n = Number(q);
  return q !== "" && Number.isInteger(n) ? n : null;
}

export async function searchAll(q, scope = "all") {
  const out = { students: [], faculty: [], courses: [] };
  const needle = String(q || "").trim();
  if (!needle) return out;
  const id = num(needle);
  if (scope === "all" || scope === "student") {
    const rows = await prisma.student.findMany({
      where: {
        OR: [
          ...(id !== null ? [{ studentId: id }] : []),
          { name: { contains: needle } },
          { email: { contains: needle } },
        ],
      },
      include: { program: true },
      take: 20,
    });
    out.students = rows.map((s) => ({
      id: s.studentId,
      title: s.name,
      sub: `#${s.studentId} · ${s.program?.name || ""} · ${s.email}`,
    }));
  }
  if (scope === "all" || scope === "faculty") {
    const rows = await prisma.faculty.findMany({
      where: {
        OR: [
          ...(id !== null ? [{ facultyId: id }] : []),
          { name: { contains: needle } },
          { email: { contains: needle } },
        ],
      },
      take: 20,
    });
    out.faculty = rows.map((f) => ({
      id: f.facultyId,
      title: f.name,
      sub: `#${f.facultyId} · ${f.facultyType} · ${f.email}`,
    }));
  }
  if (scope === "all" || scope === "course") {
    const rows = await prisma.course.findMany({
      where: {
        OR: [...(id !== null ? [{ courseId: id }] : []), { name: { contains: needle } }],
      },
      take: 20,
    });
    out.courses = rows.map((c) => ({
      id: c.courseId,
      title: c.name,
      sub: `#${c.courseId} · ${c.credits} credits · ${c.courseType}`,
    }));
  }
  return out;
}

const round2 = (n) => Math.round(n * 100) / 100;

export async function getStudentDetail(id) {
  const s = await prisma.student.findUnique({
    where: { studentId: id },
    include: {
      program: { include: { department: { include: { school: true } } } },
      mentor: true,
      phones: true,
      enrollments: { include: { course: true }, orderBy: { courseId: "asc" } },
      marks: { include: { component: true } },
      attendance: true,
      awarded: { include: { scholarship: true } },
      allocations: { include: { room: { include: { hostel: true } } } },
      undertakes: { include: { project: true } },
    },
  });
  if (!s) return null;
  const avgMarks = s.marks.length
    ? round2(s.marks.reduce((a, m) => a + m.marksObtained, 0) / s.marks.length)
    : null;
  const present = s.attendance.filter((a) => a.status === "Present").length;
  const attendancePct = s.attendance.length ? round2((100 * present) / s.attendance.length) : null;
  const byCourse = {};
  for (const a of s.attendance) {
    byCourse[a.courseId] = byCourse[a.courseId] || { total: 0, present: 0 };
    byCourse[a.courseId].total += 1;
    if (a.status === "Present") byCourse[a.courseId].present += 1;
  }
  const courseNames = Object.fromEntries(s.enrollments.map((e) => [e.courseId, e.course.name]));
  const attendanceByCourse = Object.entries(byCourse).map(([cid, v]) => ({
    courseId: Number(cid),
    courseName: courseNames[cid] || "",
    pct: round2((100 * v.present) / v.total),
    present: v.present,
    total: v.total,
  }));
  const completed = s.enrollments.filter((e) => e.grade && e.grade !== "F").length;
  return { ...s, avgMarks, attendancePct, attendanceByCourse, completed };
}

export async function getFacultyDetail(id) {
  const f = await prisma.faculty.findUnique({
    where: { facultyId: id },
    include: {
      department: true,
      qualifications: true,
      permanent: true,
      adjunct: true,
      visiting: true,
      teaches: { include: { course: true }, orderBy: { courseId: "asc" } },
      mentees: { include: { program: true }, orderBy: { studentId: "asc" } },
      supervised: { orderBy: { projectId: "asc" } },
    },
  });
  return f;
}

export async function getCourseDetail(id) {
  const c = await prisma.course.findUnique({
    where: { courseId: id },
    include: {
      department: true,
      components: { orderBy: { componentNo: "asc" } },
      enrollments: { include: { student: true }, orderBy: { studentId: "asc" } },
      teaches: { include: { faculty: true } },
      attendance: true,
    },
  });
  if (!c) return null;
  const marks = await prisma.marks.findMany({ where: { courseId: id } });
  const vals = marks.map((m) => m.marksObtained);
  const stats =
    vals.length > 0
      ? {
          count: vals.length,
          avg: round2(vals.reduce((a, v) => a + v, 0) / vals.length),
          min: Math.min(...vals),
          max: Math.max(...vals),
        }
      : null;
  const present = c.attendance.filter((a) => a.status === "Present").length;
  return {
    ...c,
    stats,
    attendanceTotal: c.attendance.length,
    attendancePresent: present,
  };
}
