// MongoDB-backed lookups — same exports + same camelCase return shape as the
// SQLite/Prisma version, so detail pages need no changes.
// Raw Mongo docs use DB column names (Student_ID, ...); adapters convert here.

import { getCollection, cleanDoc } from "./mongo";
import { TABLES } from "./tables";

export function camel(name) {
  const parts = name.toLowerCase().split("_");
  return parts.map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1))).join("");
}

export function toDelegate(table) {
  return camel(table);
}

// Convert a raw Mongo doc (DB names) to the old Prisma-like object (camelCase).
function toCamel(doc) {
  if (!doc) return doc;
  const out = {};
  for (const [k, v] of Object.entries(doc)) {
    if (k === "_id") continue;
    out[camel(k)] = v;
  }
  return out;
}

function displayCol(def) {
  return (
    def.columns.find((c) => c.name === "Name") ||
    def.columns.find((c) => c.name === "Title") ||
    def.columns.find((c) => !def.pk.includes(c.name))
  );
}

export async function getOptions(table) {
  const def = TABLES[table];
  if (!def) throw new Error("Unknown table");
  const col = await getCollection(table);
  const sort = {};
  for (const k of def.pk) sort[k] = 1;
  const docs = await col.find({}).sort(sort).limit(500).toArray();
  const disp = displayCol(def);
  return docs.map((d) => {
    const r = cleanDoc(d);
    const pkVals = def.pk.map((k) => String(r[k] ?? ""));
    const dispVal = disp ? r[disp.name] : null;
    const label =
      dispVal !== null && dispVal !== undefined && String(dispVal) !== pkVals[0]
        ? `${pkVals.join(" / ")} - ${dispVal}`
        : pkVals.join(" / ");
    return { value: pkVals[0], label };
  });
}

function num(q) {
  const n = Number(q);
  return q !== "" && Number.isInteger(n) ? n : null;
}

function regexOf(needle) {
  return { $regex: needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
}

export async function searchAll(q, scope = "all") {
  const out = { students: [], faculty: [], courses: [] };
  const needle = String(q || "").trim();
  if (!needle) return out;
  const id = num(needle);
  const rx = regexOf(needle);

  if (scope === "all" || scope === "student") {
    const col = await getCollection("STUDENT");
    const or = [{ Name: rx }, { Email: rx }];
    if (id !== null) or.unshift({ Student_ID: id });
    const rows = await col.find({ $or: or }).limit(20).toArray();
    const progCol = await getCollection("PROGRAM");
    out.students = await Promise.all(
      rows.map(async (d) => {
        const s = cleanDoc(d);
        const p = s.Program_ID != null ? await progCol.findOne({ Program_ID: s.Program_ID }) : null;
        return {
          id: s.Student_ID,
          title: s.Name,
          sub: `#${s.Student_ID} · ${p?.Name || ""} · ${s.Email}`,
        };
      })
    );
  }
  if (scope === "all" || scope === "faculty") {
    const col = await getCollection("FACULTY");
    const or = [{ Name: rx }, { Email: rx }];
    if (id !== null) or.unshift({ Faculty_ID: id });
    const rows = await col.find({ $or: or }).limit(20).toArray();
    out.faculty = rows.map((d) => {
      const f = cleanDoc(d);
      return {
        id: f.Faculty_ID,
        title: f.Name,
        sub: `#${f.Faculty_ID} · ${f.Faculty_Type} · ${f.Email}`,
      };
    });
  }
  if (scope === "all" || scope === "course") {
    const col = await getCollection("COURSE");
    const or = [{ Name: rx }];
    if (id !== null) or.unshift({ Course_ID: id });
    const rows = await col.find({ $or: or }).limit(20).toArray();
    out.courses = rows.map((d) => {
      const c = cleanDoc(d);
      return {
        id: c.Course_ID,
        title: c.Name,
        sub: `#${c.Course_ID} · ${c.Credits} credits · ${c.Course_Type}`,
      };
    });
  }
  return out;
}

const round2 = (n) => Math.round(n * 100) / 100;

async function findOne(table, filter) {
  const col = await getCollection(table);
  const d = await col.findOne(filter);
  return d ? cleanDoc(d) : null;
}

async function findMany(table, filter, sort = null) {
  const col = await getCollection(table);
  let cur = col.find(filter);
  if (sort) cur = cur.sort(sort);
  return (await cur.toArray()).map(cleanDoc);
}

export async function getStudentDetail(id) {
  const s = await findOne("STUDENT", { Student_ID: id });
  if (!s) return null;

  const programRaw = s.Program_ID != null ? await findOne("PROGRAM", { Program_ID: s.Program_ID }) : null;
  const deptRaw = programRaw ? await findOne("DEPARTMENT", { Dept_ID: programRaw.Dept_ID }) : null;
  const schoolRaw = deptRaw ? await findOne("SCHOOL", { School_ID: deptRaw.School_ID }) : null;
  const mentorRaw = s.Mentor_Faculty_ID != null ? await findOne("FACULTY", { Faculty_ID: s.Mentor_Faculty_ID }) : null;

  const phonesRaw = await findMany("STUDENT_PHONE", { Student_ID: id });
  const enrollRaw = await findMany("ENROLLMENT", { Student_ID: id }, { Course_ID: 1 });
  const marksRaw = await findMany("MARKS", { Student_ID: id });
  const attRaw = await findMany("ATTENDANCE", { Student_ID: id });
  const awardedRaw = await findMany("AWARDED", { Student_ID: id });
  const allocRaw = await findMany("ALLOCATION", { Student_ID: id });
  const undertakesRaw = await findMany("UNDERTAKES", { Student_ID: id });

  // Join helpers (small seed-scale data; N+1 is fine for assignment demo)
  const enrollments = await Promise.all(
    enrollRaw.map(async (e) => ({
      ...toCamel(e),
      course: toCamel(await findOne("COURSE", { Course_ID: e.Course_ID })),
    }))
  );
  const marks = await Promise.all(
    marksRaw.map(async (m) => ({
      ...toCamel(m),
      component: toCamel(await findOne("ASSESSMENT_COMPONENT", { Course_ID: m.Course_ID, Component_No: m.Component_No })),
    }))
  );
  const awarded = await Promise.all(
    awardedRaw.map(async (a) => ({
      ...toCamel(a),
      scholarship: toCamel(await findOne("SCHOLARSHIP", { Scholarship_ID: a.Scholarship_ID })),
    }))
  );
  const allocations = await Promise.all(
    allocRaw.map(async (a) => {
      const room = await findOne("ROOM", { Hostel_ID: a.Hostel_ID, Room_No: a.Room_No });
      const hostel = room ? await findOne("HOSTEL", { Hostel_ID: room.Hostel_ID }) : null;
      return {
        ...toCamel(a),
        room: room ? { ...toCamel(room), hostel: toCamel(hostel) } : null,
      };
    })
  );
  const undertakes = await Promise.all(
    undertakesRaw.map(async (u) => ({
      ...toCamel(u),
      project: toCamel(await findOne("PROJECT", { Project_ID: u.Project_ID })),
    }))
  );

  const avgMarks = marks.length
    ? round2(marks.reduce((a, m) => a + m.marksObtained, 0) / marks.length)
    : null;
  const present = attRaw.filter((a) => a.Status === "Present").length;
  const attendancePct = attRaw.length ? round2((100 * present) / attRaw.length) : null;
  const byCourse = {};
  for (const a of attRaw) {
    byCourse[a.Course_ID] = byCourse[a.Course_ID] || { total: 0, present: 0 };
    byCourse[a.Course_ID].total += 1;
    if (a.Status === "Present") byCourse[a.Course_ID].present += 1;
  }
  const courseNames = Object.fromEntries(enrollments.map((e) => [e.courseId, e.course?.name]));
  const attendanceByCourse = Object.entries(byCourse).map(([cid, v]) => ({
    courseId: Number(cid),
    courseName: courseNames[cid] || "",
    pct: round2((100 * v.present) / v.total),
    present: v.present,
    total: v.total,
  }));
  const completed = enrollments.filter((e) => e.grade && e.grade !== "F").length;

  return {
    ...toCamel(s),
    program: programRaw
      ? { ...toCamel(programRaw), department: deptRaw ? { ...toCamel(deptRaw), school: toCamel(schoolRaw) } : null }
      : null,
    mentor: mentorRaw ? toCamel(mentorRaw) : null,
    phones: phonesRaw.map(toCamel),
    enrollments,
    marks,
    attendance: attRaw.map(toCamel),
    awarded,
    allocations,
    undertakes,
    avgMarks,
    attendancePct,
    attendanceByCourse,
    completed,
  };
}

export async function getFacultyDetail(id) {
  const f = await findOne("FACULTY", { Faculty_ID: id });
  if (!f) return null;
  const deptRaw = await findOne("DEPARTMENT", { Dept_ID: f.Dept_ID });
  const qualsRaw = await findMany("FACULTY_QUALIFICATION", { Faculty_ID: id });
  const permRaw = await findOne("PERMANENT_FACULTY", { Faculty_ID: id });
  const adjRaw = await findOne("ADJUNCT_FACULTY", { Faculty_ID: id });
  const visRaw = await findOne("VISITING_FACULTY", { Faculty_ID: id });
  const teachesRaw = await findMany("TEACHES", { Faculty_ID: id }, { Course_ID: 1 });
  const menteesRaw = await findMany("STUDENT", { Mentor_Faculty_ID: id }, { Student_ID: 1 });
  const supervisedRaw = await findMany("PROJECT", { Faculty_ID: id }, { Project_ID: 1 });

  const teaches = await Promise.all(
    teachesRaw.map(async (t) => ({ ...toCamel(t), course: toCamel(await findOne("COURSE", { Course_ID: t.Course_ID })) }))
  );
  const mentees = await Promise.all(
    menteesRaw.map(async (m) => ({
      ...toCamel(m),
      program: m.Program_ID != null ? toCamel(await findOne("PROGRAM", { Program_ID: m.Program_ID })) : null,
    }))
  );

  return {
    ...toCamel(f),
    department: toCamel(deptRaw),
    qualifications: qualsRaw.map(toCamel),
    permanent: permRaw ? toCamel(permRaw) : null,
    adjunct: adjRaw ? toCamel(adjRaw) : null,
    visiting: visRaw ? toCamel(visRaw) : null,
    teaches,
    mentees,
    supervised: supervisedRaw.map(toCamel),
  };
}

export async function getCourseDetail(id) {
  const c = await findOne("COURSE", { Course_ID: id });
  if (!c) return null;
  const deptRaw = await findOne("DEPARTMENT", { Dept_ID: c.Dept_ID });
  const compRaw = await findMany("ASSESSMENT_COMPONENT", { Course_ID: id }, { Component_No: 1 });
  const enrollRaw = await findMany("ENROLLMENT", { Course_ID: id }, { Student_ID: 1 });
  const teachesRaw = await findMany("TEACHES", { Course_ID: id });
  const attRaw = await findMany("ATTENDANCE", { Course_ID: id });
  const marksRaw = await findMany("MARKS", { Course_ID: id });

  const enrollments = await Promise.all(
    enrollRaw.map(async (e) => ({
      ...toCamel(e),
      student: toCamel(await findOne("STUDENT", { Student_ID: e.Student_ID })),
    }))
  );
  const teaches = await Promise.all(
    teachesRaw.map(async (t) => ({
      ...toCamel(t),
      faculty: toCamel(await findOne("FACULTY", { Faculty_ID: t.Faculty_ID })),
    }))
  );

  const vals = marksRaw.map((m) => m.Marks_Obtained);
  const stats =
    vals.length > 0
      ? {
          count: vals.length,
          avg: round2(vals.reduce((a, v) => a + v, 0) / vals.length),
          min: Math.min(...vals),
          max: Math.max(...vals),
        }
      : null;
  const present = attRaw.filter((a) => a.Status === "Present").length;

  return {
    ...toCamel(c),
    department: toCamel(deptRaw),
    components: compRaw.map(toCamel),
    enrollments,
    teaches,
    attendance: attRaw.map(toCamel),
    stats,
    attendanceTotal: attRaw.length,
    attendancePresent: present,
  };
}
