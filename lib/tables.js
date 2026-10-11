// Central definition of all relations.
//   NUMBER      -> INTEGER (or REAL for decimals)
//   VARCHAR2    -> TEXT
//   DATE        -> TEXT (stored as 'YYYY-MM-DD')
// Constraints (PK, FK, UNIQUE, CHECK, NOT NULL) are preserved in schema.sql.

export const TABLES = {
  SCHOOL: {
    label: "School",
    pk: ["School_ID"],
    columns: [
      { name: "School_ID", type: "INTEGER" },
      { name: "Name", type: "TEXT" },
      { name: "Location", type: "TEXT" },
    ],
  },
  DEPARTMENT: {
    label: "Department",
    pk: ["Dept_ID"],
    columns: [
      { name: "Dept_ID", type: "INTEGER" },
      { name: "Name", type: "TEXT" },
      { name: "School_ID", type: "INTEGER" },
    ],
  },
  PROGRAM: {
    label: "Program",
    pk: ["Program_ID"],
    columns: [
      { name: "Program_ID", type: "INTEGER" },
      { name: "Name", type: "TEXT" },
      { name: "Level", type: "TEXT" },
      { name: "Duration", type: "INTEGER" },
      { name: "Dept_ID", type: "INTEGER" },
    ],
  },
  FACULTY: {
    label: "Faculty",
    pk: ["Faculty_ID"],
    columns: [
      { name: "Faculty_ID", type: "INTEGER" },
      { name: "Name", type: "TEXT" },
      { name: "Email", type: "TEXT" },
      { name: "Phone", type: "TEXT" },
      { name: "DOJ", type: "TEXT" },
      { name: "Faculty_Type", type: "TEXT" },
      { name: "Dept_ID", type: "INTEGER" },
    ],
  },
  STUDENT: {
    label: "Student",
    pk: ["Student_ID"],
    columns: [
      { name: "Student_ID", type: "INTEGER" },
      { name: "Name", type: "TEXT" },
      { name: "DOB", type: "TEXT" },
      { name: "Gender", type: "TEXT" },
      { name: "Address", type: "TEXT" },
      { name: "Email", type: "TEXT" },
      { name: "Enrollment_Year", type: "INTEGER" },
      { name: "Program_ID", type: "INTEGER" },
      { name: "Mentor_Faculty_ID", type: "INTEGER" },
      { name: "Mentor_Start_Date", type: "TEXT" },
    ],
  },
  STUDENT_PHONE: {
    label: "Student Phone",
    pk: ["Student_ID", "Phone"],
    columns: [
      { name: "Student_ID", type: "INTEGER" },
      { name: "Phone", type: "TEXT" },
    ],
  },
  FACULTY_QUALIFICATION: {
    label: "Faculty Qualification",
    pk: ["Faculty_ID", "Qualification"],
    columns: [
      { name: "Faculty_ID", type: "INTEGER" },
      { name: "Qualification", type: "TEXT" },
    ],
  },
  PERMANENT_FACULTY: {
    label: "Permanent Faculty",
    pk: ["Faculty_ID"],
    columns: [
      { name: "Faculty_ID", type: "INTEGER" },
      { name: "Salary", type: "REAL" },
      { name: "PF_Number", type: "TEXT" },
      { name: "Confirmation_Date", type: "TEXT" },
    ],
  },
  ADJUNCT_FACULTY: {
    label: "Adjunct Faculty",
    pk: ["Faculty_ID"],
    columns: [
      { name: "Faculty_ID", type: "INTEGER" },
      { name: "Hourly_Rate", type: "REAL" },
      { name: "Contract_End_Date", type: "TEXT" },
    ],
  },
  VISITING_FACULTY: {
    label: "Visiting Faculty",
    pk: ["Faculty_ID"],
    columns: [
      { name: "Faculty_ID", type: "INTEGER" },
      { name: "Home_Institution", type: "TEXT" },
      { name: "Visit_Duration_Months", type: "INTEGER" },
    ],
  },
  COURSE: {
    label: "Course",
    pk: ["Course_ID"],
    columns: [
      { name: "Course_ID", type: "INTEGER" },
      { name: "Name", type: "TEXT" },
      { name: "Credits", type: "INTEGER" },
      { name: "Course_Type", type: "TEXT" },
      { name: "Dept_ID", type: "INTEGER" },
    ],
  },
  ASSESSMENT_COMPONENT: {
    label: "Assessment Component",
    pk: ["Course_ID", "Component_No"],
    columns: [
      { name: "Course_ID", type: "INTEGER" },
      { name: "Component_No", type: "INTEGER" },
      { name: "Type", type: "TEXT" },
      { name: "Max_Marks", type: "REAL" },
      { name: "Weightage", type: "REAL" },
    ],
  },
  ENROLLMENT: {
    label: "Enrollment",
    pk: ["Student_ID", "Course_ID", "Year", "Semester"],
    columns: [
      { name: "Student_ID", type: "INTEGER" },
      { name: "Course_ID", type: "INTEGER" },
      { name: "Year", type: "INTEGER" },
      { name: "Semester", type: "INTEGER" },
      { name: "Grade", type: "TEXT" },
    ],
  },
  ATTENDANCE: {
    label: "Attendance",
    pk: ["Attendance_ID"],
    columns: [
      { name: "Attendance_ID", type: "INTEGER" },
      { name: "Student_ID", type: "INTEGER" },
      { name: "Course_ID", type: "INTEGER" },
      { name: "Year", type: "INTEGER" },
      { name: "Semester", type: "INTEGER" },
      { name: "Att_Date", type: "TEXT" },
      { name: "Status", type: "TEXT" },
    ],
  },
  MARKS: {
    label: "Marks",
    pk: ["Student_ID", "Course_ID", "Year", "Semester", "Component_No"],
    columns: [
      { name: "Student_ID", type: "INTEGER" },
      { name: "Course_ID", type: "INTEGER" },
      { name: "Year", type: "INTEGER" },
      { name: "Semester", type: "INTEGER" },
      { name: "Component_No", type: "INTEGER" },
      { name: "Marks_Obtained", type: "REAL" },
    ],
  },
  TEACHES: {
    label: "Teaches",
    pk: ["Course_ID", "Year", "Semester"],
    columns: [
      { name: "Course_ID", type: "INTEGER" },
      { name: "Year", type: "INTEGER" },
      { name: "Semester", type: "INTEGER" },
      { name: "Faculty_ID", type: "INTEGER" },
    ],
  },
  SCHOLARSHIP: {
    label: "Scholarship",
    pk: ["Scholarship_ID"],
    columns: [
      { name: "Scholarship_ID", type: "INTEGER" },
      { name: "Name", type: "TEXT" },
      { name: "Type", type: "TEXT" },
      { name: "Amount", type: "REAL" },
      { name: "Eligibility", type: "TEXT" },
    ],
  },
  AWARDED: {
    label: "Awarded",
    pk: ["Student_ID", "Scholarship_ID", "Year"],
    columns: [
      { name: "Student_ID", type: "INTEGER" },
      { name: "Scholarship_ID", type: "INTEGER" },
      { name: "Year", type: "INTEGER" },
      { name: "Award_Date", type: "TEXT" },
    ],
  },
  HOSTEL: {
    label: "Hostel",
    pk: ["Hostel_ID"],
    columns: [
      { name: "Hostel_ID", type: "INTEGER" },
      { name: "Name", type: "TEXT" },
      { name: "Warden", type: "TEXT" },
      { name: "Capacity", type: "INTEGER" },
    ],
  },
  ROOM: {
    label: "Room",
    pk: ["Hostel_ID", "Room_No"],
    columns: [
      { name: "Hostel_ID", type: "INTEGER" },
      { name: "Room_No", type: "TEXT" },
      { name: "Capacity", type: "INTEGER" },
      { name: "Type", type: "TEXT" },
    ],
  },
  ALLOCATION: {
    label: "Allocation",
    pk: ["Student_ID", "Hostel_ID", "Room_No", "Alloc_Date"],
    columns: [
      { name: "Student_ID", type: "INTEGER" },
      { name: "Hostel_ID", type: "INTEGER" },
      { name: "Room_No", type: "TEXT" },
      { name: "Alloc_Date", type: "TEXT" },
      { name: "Vacate_Date", type: "TEXT" },
    ],
  },
  PROJECT: {
    label: "Project",
    pk: ["Project_ID"],
    columns: [
      { name: "Project_ID", type: "INTEGER" },
      { name: "Title", type: "TEXT" },
      { name: "Type", type: "TEXT" },
      { name: "Start_Date", type: "TEXT" },
      { name: "End_Date", type: "TEXT" },
      { name: "Host_Org", type: "TEXT" },
      { name: "Faculty_ID", type: "INTEGER" },
    ],
  },
  UNDERTAKES: {
    label: "Undertakes",
    pk: ["Student_ID", "Project_ID"],
    columns: [
      { name: "Student_ID", type: "INTEGER" },
      { name: "Project_ID", type: "INTEGER" },
      { name: "Role", type: "TEXT" },
    ],
  },
};

export const TABLE_NAMES = Object.keys(TABLES);

// Foreign-key map: TABLE -> { column: referenced TABLE }.
// Single-column FKs render as dropdowns in CRUD forms; composite FK
// columns (e.g. MARKS.Component_No) stay as typed inputs.
export const FK_REFS = {
  DEPARTMENT: { School_ID: "SCHOOL" },
  PROGRAM: { Dept_ID: "DEPARTMENT" },
  FACULTY: { Dept_ID: "DEPARTMENT" },
  STUDENT: { Program_ID: "PROGRAM", Mentor_Faculty_ID: "FACULTY" },
  STUDENT_PHONE: { Student_ID: "STUDENT" },
  FACULTY_QUALIFICATION: { Faculty_ID: "FACULTY" },
  PERMANENT_FACULTY: { Faculty_ID: "FACULTY" },
  ADJUNCT_FACULTY: { Faculty_ID: "FACULTY" },
  VISITING_FACULTY: { Faculty_ID: "FACULTY" },
  COURSE: { Dept_ID: "DEPARTMENT" },
  ASSESSMENT_COMPONENT: { Course_ID: "COURSE" },
  ENROLLMENT: { Student_ID: "STUDENT", Course_ID: "COURSE" },
  ATTENDANCE: { Student_ID: "STUDENT", Course_ID: "COURSE" },
  MARKS: { Student_ID: "STUDENT", Course_ID: "COURSE" },
  TEACHES: { Course_ID: "COURSE", Faculty_ID: "FACULTY" },
  AWARDED: { Student_ID: "STUDENT", Scholarship_ID: "SCHOLARSHIP" },
  ROOM: { Hostel_ID: "HOSTEL" },
  ALLOCATION: { Student_ID: "STUDENT", Hostel_ID: "HOSTEL" },
  PROJECT: { Faculty_ID: "FACULTY" },
  UNDERTAKES: { Student_ID: "STUDENT", Project_ID: "PROJECT" },
};
