// CouchDB seed script — seeds all 23 relations into CouchDB using DB column names.
// Run:
//   npm run db:seed        (or npm run db:seed:couch)
//   npm run db:reset       (drops and recreates the CouchDB database, then seeds)

const rawUrl = process.env.COUCHDB_URL;
if (!rawUrl) {
  console.error(
    "COUCHDB_URL is not set. Copy .env.example to .env and set COUCHDB_URL (e.g. http://admin:password@127.0.0.1:5984)."
  );
  process.exit(1);
}

function normalizeCouchUrl(urlStr) {
  const match = urlStr.match(/^(https?:\/\/)(.+)$/);
  if (!match) return urlStr;
  const [, scheme, rest] = match;
  const slashIdx = rest.indexOf("/");
  const authority = slashIdx === -1 ? rest : rest.slice(0, slashIdx);
  const pathPart = slashIdx === -1 ? "" : rest.slice(slashIdx);
  const lastAt = authority.lastIndexOf("@");
  if (lastAt === -1) return urlStr;
  const userInfo = authority.slice(0, lastAt);
  const hostPart = authority.slice(lastAt + 1);
  const colonIdx = userInfo.indexOf(":");
  if (colonIdx === -1) return urlStr;
  const u = encodeURIComponent(decodeURIComponent(userInfo.slice(0, colonIdx)));
  const p = encodeURIComponent(decodeURIComponent(userInfo.slice(colonIdx + 1)));
  return `${scheme}${u}:${p}@${hostPart}${pathPart}`;
}

let parsed;
try {
  parsed = new URL(normalizeCouchUrl(rawUrl));
} catch {
  console.error(`Invalid COUCHDB_URL: "${rawUrl}"`);
  process.exit(1);
}

const user =
  process.env.COUCHDB_USER ||
  (parsed.username ? decodeURIComponent(parsed.username) : "");
const pass =
  process.env.COUCHDB_PASSWORD ||
  (parsed.password ? decodeURIComponent(parsed.password) : "");
const pathDb = parsed.pathname.replace(/^\/+|\/+$/g, "");
const dbName = (process.env.COUCHDB_DB || pathDb || "abc_university").toLowerCase();

parsed.username = "";
parsed.password = "";
parsed.pathname = "";
parsed.search = "";
parsed.hash = "";
const baseUrl = parsed.toString().replace(/\/+$/, "");

const headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
};
if (user || pass) {
  headers.Authorization = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

async function couchRequest(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  return { status: res.status, ok: res.ok, data };
}

const PK_MAP = {
  SCHOOL: ["School_ID"],
  DEPARTMENT: ["Dept_ID"],
  PROGRAM: ["Program_ID"],
  FACULTY: ["Faculty_ID"],
  STUDENT: ["Student_ID"],
  STUDENT_PHONE: ["Student_ID", "Phone"],
  FACULTY_QUALIFICATION: ["Faculty_ID", "Qualification"],
  PERMANENT_FACULTY: ["Faculty_ID"],
  ADJUNCT_FACULTY: ["Faculty_ID"],
  VISITING_FACULTY: ["Faculty_ID"],
  COURSE: ["Course_ID"],
  ASSESSMENT_COMPONENT: ["Course_ID", "Component_No"],
  ENROLLMENT: ["Student_ID", "Course_ID", "Year", "Semester"],
  ATTENDANCE: ["Attendance_ID"],
  MARKS: ["Student_ID", "Course_ID", "Year", "Semester", "Component_No"],
  TEACHES: ["Course_ID", "Year", "Semester"],
  SCHOLARSHIP: ["Scholarship_ID"],
  AWARDED: ["Student_ID", "Scholarship_ID", "Year"],
  HOSTEL: ["Hostel_ID"],
  ROOM: ["Hostel_ID", "Room_No"],
  ALLOCATION: ["Student_ID", "Hostel_ID", "Room_No", "Alloc_Date"],
  PROJECT: ["Project_ID"],
  UNDERTAKES: ["Student_ID", "Project_ID"],
};

const SEED_DATA = {
  SCHOOL: [
    { School_ID: 1, Name: "School of Computing", Location: "Chennai" },
    { School_ID: 2, Name: "School of Engineering", Location: "Chennai" },
    { School_ID: 3, Name: "School of Management", Location: "Chennai" },
    { School_ID: 4, Name: "School of Sciences", Location: "Chennai" },
    { School_ID: 5, Name: "School of Humanities", Location: "Chennai" },
  ],
  DEPARTMENT: [
    { Dept_ID: 101, Name: "Computer Science", School_ID: 1 },
    { Dept_ID: 102, Name: "Data Science", School_ID: 1 },
    { Dept_ID: 103, Name: "Electronics", School_ID: 2 },
    { Dept_ID: 104, Name: "Management Studies", School_ID: 3 },
    { Dept_ID: 105, Name: "Mathematics", School_ID: 4 },
  ],
  PROGRAM: [
    { Program_ID: 201, Name: "B.Tech Computer Science", Level: "UG", Duration: 4, Dept_ID: 101 },
    { Program_ID: 202, Name: "M.Tech Artificial Intelligence", Level: "PG", Duration: 2, Dept_ID: 102 },
    { Program_ID: 203, Name: "Ph.D. Data Science", Level: "Doctoral", Duration: 5, Dept_ID: 102 },
    { Program_ID: 204, Name: "B.Tech Electronics", Level: "UG", Duration: 4, Dept_ID: 103 },
    { Program_ID: 205, Name: "B.Sc Mathematics", Level: "UG", Duration: 3, Dept_ID: 105 },
  ],
  FACULTY: [
    { Faculty_ID: 301, Name: "Dr. Arun Kumar", Email: "arun@abc.edu", Phone: "9000000001", DOJ: "2018-06-10", Faculty_Type: "Permanent", Dept_ID: 101 },
    { Faculty_ID: 302, Name: "Dr. Meera Rao", Email: "meera@abc.edu", Phone: "9000000002", DOJ: "2019-07-15", Faculty_Type: "Permanent", Dept_ID: 101 },
    { Faculty_ID: 303, Name: "Dr. Neha Iyer", Email: "neha@abc.edu", Phone: "9000000003", DOJ: "2021-08-01", Faculty_Type: "Adjunct", Dept_ID: 102 },
    { Faculty_ID: 304, Name: "Dr. Ravi Menon", Email: "ravi@abc.edu", Phone: "9000000004", DOJ: "2022-02-12", Faculty_Type: "Adjunct", Dept_ID: 103 },
    { Faculty_ID: 305, Name: "Dr. Priya Nair", Email: "priya@abc.edu", Phone: "9000000005", DOJ: "2017-05-18", Faculty_Type: "Visiting", Dept_ID: 105 },
  ],
  FACULTY_QUALIFICATION: [
    { Faculty_ID: 301, Qualification: "Ph.D. Computer Science" },
    { Faculty_ID: 302, Qualification: "Ph.D. Data Science" },
    { Faculty_ID: 303, Qualification: "Ph.D. Artificial Intelligence" },
    { Faculty_ID: 304, Qualification: "Ph.D. Electronics" },
    { Faculty_ID: 305, Qualification: "Ph.D. Mathematics" },
  ],
  PERMANENT_FACULTY: [
    { Faculty_ID: 301, Salary: 120000, PF_Number: "PF301", Confirmation_Date: "2020-06-10" },
    { Faculty_ID: 302, Salary: 115000, PF_Number: "PF302", Confirmation_Date: "2021-07-15" },
  ],
  ADJUNCT_FACULTY: [
    { Faculty_ID: 303, Hourly_Rate: 1800, Contract_End_Date: "2027-06-30" },
    { Faculty_ID: 304, Hourly_Rate: 2000, Contract_End_Date: "2027-12-31" },
  ],
  VISITING_FACULTY: [
    { Faculty_ID: 305, Home_Institution: "IIT Madras", Visit_Duration_Months: 12 },
  ],
  STUDENT: [
    { Student_ID: 1001, Name: "Aarav Singh", DOB: "2005-04-12", Gender: "M", Address: "Chennai", Email: "aarav@abc.edu", Enrollment_Year: 2025, Program_ID: 201, Mentor_Faculty_ID: 301, Mentor_Start_Date: "2025-08-01" },
    { Student_ID: 1002, Name: "Diya Sharma", DOB: "2005-09-20", Gender: "F", Address: "Chennai", Email: "diya@abc.edu", Enrollment_Year: 2025, Program_ID: 201, Mentor_Faculty_ID: 302, Mentor_Start_Date: "2025-08-01" },
    { Student_ID: 1003, Name: "Kabir Patel", DOB: "2001-03-05", Gender: "M", Address: "Bengaluru", Email: "kabir@abc.edu", Enrollment_Year: 2025, Program_ID: 202, Mentor_Faculty_ID: 303, Mentor_Start_Date: "2025-08-01" },
    { Student_ID: 1004, Name: "Ananya Das", DOB: "2000-11-11", Gender: "F", Address: "Kolkata", Email: "ananya@abc.edu", Enrollment_Year: 2025, Program_ID: 204, Mentor_Faculty_ID: 304, Mentor_Start_Date: "2025-08-01" },
    { Student_ID: 1005, Name: "Rohan Gupta", DOB: "1999-07-08", Gender: "M", Address: "Delhi", Email: "rohan@abc.edu", Enrollment_Year: 2025, Program_ID: 205, Mentor_Faculty_ID: 305, Mentor_Start_Date: "2025-08-01" },
  ],
  STUDENT_PHONE: [
    { Student_ID: 1001, Phone: "9100000001" },
    { Student_ID: 1002, Phone: "9100000002" },
    { Student_ID: 1003, Phone: "9100000003" },
    { Student_ID: 1004, Phone: "9100000004" },
    { Student_ID: 1005, Phone: "9100000005" },
  ],
  COURSE: [
    { Course_ID: 401, Name: "Database Systems", Credits: 4, Course_Type: "Core", Dept_ID: 101 },
    { Course_ID: 402, Name: "Machine Learning", Credits: 4, Course_Type: "Core", Dept_ID: 102 },
    { Course_ID: 403, Name: "Digital Electronics", Credits: 3, Course_Type: "Core", Dept_ID: 103 },
    { Course_ID: 404, Name: "Business Analytics", Credits: 3, Course_Type: "Elective", Dept_ID: 104 },
    { Course_ID: 405, Name: "Statistical Methods", Credits: 3, Course_Type: "Core", Dept_ID: 105 },
  ],
  ASSESSMENT_COMPONENT: [
    { Course_ID: 401, Component_No: 1, Type: "End-Sem", Max_Marks: 100, Weightage: 100 },
    { Course_ID: 402, Component_No: 1, Type: "End-Sem", Max_Marks: 100, Weightage: 100 },
    { Course_ID: 403, Component_No: 1, Type: "End-Sem", Max_Marks: 100, Weightage: 100 },
    { Course_ID: 404, Component_No: 1, Type: "End-Sem", Max_Marks: 100, Weightage: 100 },
    { Course_ID: 405, Component_No: 1, Type: "End-Sem", Max_Marks: 100, Weightage: 100 },
  ],
  ENROLLMENT: [
    { Student_ID: 1001, Course_ID: 401, Year: 2025, Semester: 1, Grade: "A" },
    { Student_ID: 1002, Course_ID: 401, Year: 2025, Semester: 1, Grade: "B" },
    { Student_ID: 1003, Course_ID: 402, Year: 2025, Semester: 1, Grade: "A" },
    { Student_ID: 1004, Course_ID: 403, Year: 2025, Semester: 1, Grade: "B" },
    { Student_ID: 1005, Course_ID: 405, Year: 2025, Semester: 1, Grade: "A" },
  ],
  ATTENDANCE: [
    { Attendance_ID: 5001, Student_ID: 1001, Course_ID: 401, Year: 2025, Semester: 1, Att_Date: "2025-01-10", Status: "Present" },
    { Attendance_ID: 5002, Student_ID: 1002, Course_ID: 401, Year: 2025, Semester: 1, Att_Date: "2025-01-10", Status: "Absent" },
    { Attendance_ID: 5003, Student_ID: 1003, Course_ID: 402, Year: 2025, Semester: 1, Att_Date: "2025-01-10", Status: "Present" },
    { Attendance_ID: 5004, Student_ID: 1004, Course_ID: 403, Year: 2025, Semester: 1, Att_Date: "2025-01-10", Status: "Present" },
    { Attendance_ID: 5005, Student_ID: 1005, Course_ID: 405, Year: 2025, Semester: 1, Att_Date: "2025-01-10", Status: "Absent" },
  ],
  MARKS: [
    { Student_ID: 1001, Course_ID: 401, Year: 2025, Semester: 1, Component_No: 1, Marks_Obtained: 88 },
    { Student_ID: 1002, Course_ID: 401, Year: 2025, Semester: 1, Component_No: 1, Marks_Obtained: 68 },
    { Student_ID: 1003, Course_ID: 402, Year: 2025, Semester: 1, Component_No: 1, Marks_Obtained: 92 },
    { Student_ID: 1004, Course_ID: 403, Year: 2025, Semester: 1, Component_No: 1, Marks_Obtained: 74 },
    { Student_ID: 1005, Course_ID: 405, Year: 2025, Semester: 1, Component_No: 1, Marks_Obtained: 81 },
  ],
  TEACHES: [
    { Course_ID: 401, Year: 2025, Semester: 1, Faculty_ID: 301 },
    { Course_ID: 402, Year: 2025, Semester: 1, Faculty_ID: 303 },
    { Course_ID: 403, Year: 2025, Semester: 1, Faculty_ID: 304 },
    { Course_ID: 404, Year: 2025, Semester: 1, Faculty_ID: 302 },
    { Course_ID: 405, Year: 2025, Semester: 1, Faculty_ID: 305 },
  ],
  SCHOLARSHIP: [
    { Scholarship_ID: 601, Name: "Merit Scholarship", Type: "Merit", Amount: 50000, Eligibility: "High academic performance" },
    { Scholarship_ID: 602, Name: "Need Support", Type: "Need-based", Amount: 30000, Eligibility: "Financial need" },
    { Scholarship_ID: 603, Name: "Research Grant", Type: "Research", Amount: 75000, Eligibility: "Approved research work" },
    { Scholarship_ID: 604, Name: "Sports Scholarship", Type: "Sports", Amount: 25000, Eligibility: "Sports achievement" },
    { Scholarship_ID: 605, Name: "Women in STEM", Type: "Merit", Amount: 40000, Eligibility: "Academic performance" },
  ],
  AWARDED: [
    { Student_ID: 1001, Scholarship_ID: 601, Year: 2025, Award_Date: "2025-08-05" },
    { Student_ID: 1002, Scholarship_ID: 602, Year: 2025, Award_Date: "2025-08-06" },
    { Student_ID: 1003, Scholarship_ID: 603, Year: 2025, Award_Date: "2025-08-07" },
    { Student_ID: 1004, Scholarship_ID: 604, Year: 2025, Award_Date: "2025-08-08" },
    { Student_ID: 1005, Scholarship_ID: 605, Year: 2025, Award_Date: "2025-08-09" },
  ],
  HOSTEL: [
    { Hostel_ID: 701, Name: "A-Block Hostel", Warden: "S. Kumar", Capacity: 200 },
    { Hostel_ID: 702, Name: "B-Block Hostel", Warden: "R. Singh", Capacity: 180 },
    { Hostel_ID: 703, Name: "C-Block Hostel", Warden: "P. Das", Capacity: 150 },
    { Hostel_ID: 704, Name: "D-Block Hostel", Warden: "M. Iyer", Capacity: 120 },
    { Hostel_ID: 705, Name: "E-Block Hostel", Warden: "K. Nair", Capacity: 100 },
  ],
  ROOM: [
    { Hostel_ID: 701, Room_No: "101", Capacity: 2, Type: "Double" },
    { Hostel_ID: 701, Room_No: "102", Capacity: 2, Type: "Double" },
    { Hostel_ID: 702, Room_No: "101", Capacity: 2, Type: "Double" },
    { Hostel_ID: 703, Room_No: "101", Capacity: 3, Type: "Triple" },
    { Hostel_ID: 704, Room_No: "101", Capacity: 2, Type: "Double" },
  ],
  ALLOCATION: [
    { Student_ID: 1001, Hostel_ID: 701, Room_No: "101", Alloc_Date: "2025-08-10", Vacate_Date: null },
    { Student_ID: 1002, Hostel_ID: 701, Room_No: "102", Alloc_Date: "2025-08-10", Vacate_Date: null },
    { Student_ID: 1003, Hostel_ID: 702, Room_No: "101", Alloc_Date: "2025-08-11", Vacate_Date: null },
    { Student_ID: 1004, Hostel_ID: 703, Room_No: "101", Alloc_Date: "2025-08-12", Vacate_Date: null },
    { Student_ID: 1005, Hostel_ID: 704, Room_No: "101", Alloc_Date: "2025-08-12", Vacate_Date: null },
  ],
  PROJECT: [
    { Project_ID: 801, Title: "Smart Campus Analytics", Type: "Research", Start_Date: "2025-01-10", End_Date: "2025-06-30", Host_Org: "ABC Research Lab", Faculty_ID: 301 },
    { Project_ID: 802, Title: "AI for Student Support", Type: "Research", Start_Date: "2025-02-01", End_Date: "2025-08-31", Host_Org: "ABC Innovation Cell", Faculty_ID: 303 },
    { Project_ID: 803, Title: "Embedded Systems Lab", Type: "Research", Start_Date: "2025-03-01", End_Date: "2025-07-31", Host_Org: "ABC Electronics Lab", Faculty_ID: 304 },
    { Project_ID: 804, Title: "Business Intelligence Study", Type: "Research", Start_Date: "2025-03-15", End_Date: null, Host_Org: "ABC Management Cell", Faculty_ID: 302 },
    { Project_ID: 805, Title: "Statistical Research Study", Type: "Research", Start_Date: "2025-04-01", End_Date: null, Host_Org: "DataLab Institute", Faculty_ID: 305 },
  ],
  UNDERTAKES: [
    { Student_ID: 1001, Project_ID: 801, Role: "Developer" },
    { Student_ID: 1002, Project_ID: 802, Role: "Analyst" },
    { Student_ID: 1003, Project_ID: 803, Role: "Researcher" },
    { Student_ID: 1004, Project_ID: 804, Role: "Researcher" },
    { Student_ID: 1005, Project_ID: 805, Role: "Researcher" },
  ],
};

async function main() {
  const shouldReset = process.argv.includes("--reset");
  const encDb = encodeURIComponent(dbName);

  if (shouldReset) {
    console.log(`Resetting CouchDB database "${dbName}"...`);
    await couchRequest(`/${encDb}`, { method: "DELETE" });
  }

  // Ensure database exists
  const head = await couchRequest(`/${encDb}`, { method: "HEAD" });
  if (head.status === 404) {
    const created = await couchRequest(`/${encDb}`, { method: "PUT" });
    if (!created.ok && created.status !== 412) {
      throw new Error(
        created.data?.reason || created.data?.error || `Failed to create database "${dbName}"`
      );
    }
  } else if (!head.ok) {
    throw new Error(`Cannot access CouchDB at ${baseUrl} (HTTP ${head.status})`);
  }

  // Check if SCHOOL:1 already exists
  const existingSchool = await couchRequest(`/${encDb}/${encodeURIComponent("SCHOOL:1")}`);
  if (existingSchool.ok) {
    console.log("Seed skipped: CouchDB already has data. (Use `npm run db:reset` to wipe and reseed.)");
    return;
  }

  // Create Mango indexes
  const indexes = [
    { name: "idx_table", fields: ["table"] },
    { name: "idx_student_email", fields: ["table", "Email"] },
    { name: "idx_student_id", fields: ["table", "Student_ID"] },
    { name: "idx_faculty_id", fields: ["table", "Faculty_ID"] },
    { name: "idx_course_id", fields: ["table", "Course_ID"] },
  ];
  for (const idx of indexes) {
    await couchRequest(`/${encDb}/_index`, {
      method: "POST",
      body: JSON.stringify({
        index: { fields: idx.fields },
        name: idx.name,
        type: "json",
      }),
    });
  }

  // Create Design Document with MapReduce views
  const ddocId = "_design/university";
  const curDdoc = await couchRequest(`/${encDb}/${ddocId}`);
  const ddoc = {
    _id: ddocId,
    ...(curDdoc.ok && curDdoc.data?._rev ? { _rev: curDdoc.data._rev } : {}),
    language: "javascript",
    views: {
      by_table: {
        map: "function(doc) { if (doc.table) emit(doc.table, 1); }",
        reduce: "_count",
      },
      students_by_program: {
        map: "function(doc) { if (doc.table === 'STUDENT') emit(doc.Program_ID, { id: doc.Student_ID, name: doc.Name, email: doc.Email }); }",
      },
      enrollments_by_course: {
        map: "function(doc) { if (doc.table === 'ENROLLMENT') emit(doc.Course_ID, { studentId: doc.Student_ID, year: doc.Year, semester: doc.Semester, grade: doc.Grade }); }",
      },
      marks_by_course: {
        map: "function(doc) { if (doc.table === 'MARKS' && typeof doc.Marks_Obtained === 'number') emit(doc.Course_ID, doc.Marks_Obtained); }",
        reduce: "_stats",
      },
    },
  };
  await couchRequest(`/${encDb}/${ddocId}`, {
    method: "PUT",
    body: JSON.stringify(ddoc),
  });

  // Build bulk documents for all 23 tables
  const docs = [];
  for (const [table, rows] of Object.entries(SEED_DATA)) {
    const pkCols = PK_MAP[table];
    for (const row of rows) {
      const idParts = pkCols.map((k) => String(row[k]));
      docs.push({
        _id: `${table}:${idParts.join(":")}`,
        table,
        ...row,
      });
    }
  }

  const bulkRes = await couchRequest(`/${encDb}/_bulk_docs`, {
    method: "POST",
    body: JSON.stringify({ docs }),
  });
  if (!bulkRes.ok) {
    throw new Error(bulkRes.data?.reason || bulkRes.data?.error || "Bulk seed failed");
  }

  const errors = (bulkRes.data || []).filter((r) => r.error);
  if (errors.length > 0) {
    throw new Error(`Bulk seed had ${errors.length} document errors: ${JSON.stringify(errors[0])}`);
  }

  console.log(`CouchDB seed complete (${docs.length} documents across 23 tables in "${dbName}").`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
