// MongoDB seed — mirrors scripts/seed.js data, using DB column names.
// Run: npm run db:seed:mongo  (requires MONGODB_URI in .env)

const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "abc-university";

if (!uri) {
  console.error("MONGODB_URI is not set. Copy .env.example to .env and set your Atlas URI.");
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const schoolCount = await db.collection("SCHOOL").countDocuments();
  if (schoolCount > 0) {
    console.log("Seed skipped: MongoDB already has data.");
    await client.close();
    return;
  }

  // Unique indexes for PKs (same as lib/mongo.js ensureIndexes)
  const PK_INDEXES = {
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
  for (const [table, pk] of Object.entries(PK_INDEXES)) {
    const keys = {};
    for (const k of pk) keys[k] = 1;
    await db.collection(table).createIndex(keys, { unique: true, name: `pk_${table}` });
  }
  await db.collection("STUDENT").createIndex({ Email: 1 }, { unique: true, name: "uq_STUDENT_Email" });
  await db.collection("FACULTY").createIndex({ Email: 1 }, { unique: true, name: "uq_FACULTY_Email" });
  await db.collection("PERMANENT_FACULTY").createIndex({ PF_Number: 1 }, { unique: true, name: "uq_PERM_PF" });
  await db
    .collection("ATTENDANCE")
    .createIndex({ Student_ID: 1, Course_ID: 1, Att_Date: 1 }, { unique: true, name: "uq_ATTENDANCE_day" });

  await db.collection("SCHOOL").insertMany([
    { School_ID: 1, Name: "School of Computing", Location: "Chennai" },
    { School_ID: 2, Name: "School of Engineering", Location: "Chennai" },
    { School_ID: 3, Name: "School of Management", Location: "Chennai" },
    { School_ID: 4, Name: "School of Sciences", Location: "Chennai" },
    { School_ID: 5, Name: "School of Humanities", Location: "Chennai" },
  ]);
  await db.collection("DEPARTMENT").insertMany([
    { Dept_ID: 101, Name: "Computer Science", School_ID: 1 },
    { Dept_ID: 102, Name: "Data Science", School_ID: 1 },
    { Dept_ID: 103, Name: "Electronics", School_ID: 2 },
    { Dept_ID: 104, Name: "Management Studies", School_ID: 3 },
    { Dept_ID: 105, Name: "Mathematics", School_ID: 4 },
  ]);
  await db.collection("PROGRAM").insertMany([
    { Program_ID: 201, Name: "B.Tech Computer Science", Level: "UG", Duration: 4, Dept_ID: 101 },
    { Program_ID: 202, Name: "M.Tech Artificial Intelligence", Level: "PG", Duration: 2, Dept_ID: 102 },
    { Program_ID: 203, Name: "Ph.D. Data Science", Level: "Doctoral", Duration: 5, Dept_ID: 102 },
    { Program_ID: 204, Name: "B.Tech Electronics", Level: "UG", Duration: 4, Dept_ID: 103 },
    { Program_ID: 205, Name: "B.Sc Mathematics", Level: "UG", Duration: 3, Dept_ID: 105 },
  ]);
  await db.collection("FACULTY").insertMany([
    { Faculty_ID: 301, Name: "Dr. Arun Kumar", Email: "arun@abc.edu", Phone: "9000000001", DOJ: "2018-06-10", Faculty_Type: "Permanent", Dept_ID: 101 },
    { Faculty_ID: 302, Name: "Dr. Meera Rao", Email: "meera@abc.edu", Phone: "9000000002", DOJ: "2019-07-15", Faculty_Type: "Permanent", Dept_ID: 101 },
    { Faculty_ID: 303, Name: "Dr. Neha Iyer", Email: "neha@abc.edu", Phone: "9000000003", DOJ: "2021-08-01", Faculty_Type: "Adjunct", Dept_ID: 102 },
    { Faculty_ID: 304, Name: "Dr. Ravi Menon", Email: "ravi@abc.edu", Phone: "9000000004", DOJ: "2022-02-12", Faculty_Type: "Adjunct", Dept_ID: 103 },
    { Faculty_ID: 305, Name: "Dr. Priya Nair", Email: "priya@abc.edu", Phone: "9000000005", DOJ: "2017-05-18", Faculty_Type: "Visiting", Dept_ID: 105 },
  ]);
  await db.collection("FACULTY_QUALIFICATION").insertMany([
    { Faculty_ID: 301, Qualification: "Ph.D. Computer Science" },
    { Faculty_ID: 302, Qualification: "Ph.D. Data Science" },
    { Faculty_ID: 303, Qualification: "Ph.D. Artificial Intelligence" },
    { Faculty_ID: 304, Qualification: "Ph.D. Electronics" },
    { Faculty_ID: 305, Qualification: "Ph.D. Mathematics" },
  ]);
  await db.collection("PERMANENT_FACULTY").insertMany([
    { Faculty_ID: 301, Salary: 120000, PF_Number: "PF301", Confirmation_Date: "2020-06-10" },
    { Faculty_ID: 302, Salary: 115000, PF_Number: "PF302", Confirmation_Date: "2021-07-15" },
  ]);
  await db.collection("ADJUNCT_FACULTY").insertMany([
    { Faculty_ID: 303, Hourly_Rate: 1800, Contract_End_Date: "2027-06-30" },
    { Faculty_ID: 304, Hourly_Rate: 2000, Contract_End_Date: "2027-12-31" },
  ]);
  await db.collection("VISITING_FACULTY").insertOne(
    { Faculty_ID: 305, Home_Institution: "IIT Madras", Visit_Duration_Months: 12 }
  );
  await db.collection("STUDENT").insertMany([
    { Student_ID: 1001, Name: "Aarav Singh", DOB: "2005-04-12", Gender: "M", Address: "Chennai", Email: "aarav@abc.edu", Enrollment_Year: 2025, Program_ID: 201, Mentor_Faculty_ID: 301, Mentor_Start_Date: "2025-08-01" },
    { Student_ID: 1002, Name: "Diya Sharma", DOB: "2005-09-20", Gender: "F", Address: "Chennai", Email: "diya@abc.edu", Enrollment_Year: 2025, Program_ID: 201, Mentor_Faculty_ID: 302, Mentor_Start_Date: "2025-08-01" },
    { Student_ID: 1003, Name: "Kabir Patel", DOB: "2001-03-05", Gender: "M", Address: "Bengaluru", Email: "kabir@abc.edu", Enrollment_Year: 2025, Program_ID: 202, Mentor_Faculty_ID: 303, Mentor_Start_Date: "2025-08-01" },
    { Student_ID: 1004, Name: "Ananya Das", DOB: "2000-11-11", Gender: "F", Address: "Kolkata", Email: "ananya@abc.edu", Enrollment_Year: 2025, Program_ID: 204, Mentor_Faculty_ID: 304, Mentor_Start_Date: "2025-08-01" },
    { Student_ID: 1005, Name: "Rohan Gupta", DOB: "1999-07-08", Gender: "M", Address: "Delhi", Email: "rohan@abc.edu", Enrollment_Year: 2025, Program_ID: 205, Mentor_Faculty_ID: 305, Mentor_Start_Date: "2025-08-01" },
  ]);
  await db.collection("STUDENT_PHONE").insertMany([
    { Student_ID: 1001, Phone: "9100000001" },
    { Student_ID: 1002, Phone: "9100000002" },
    { Student_ID: 1003, Phone: "9100000003" },
    { Student_ID: 1004, Phone: "9100000004" },
    { Student_ID: 1005, Phone: "9100000005" },
  ]);
  await db.collection("COURSE").insertMany([
    { Course_ID: 401, Name: "Database Systems", Credits: 4, Course_Type: "Core", Dept_ID: 101 },
    { Course_ID: 402, Name: "Machine Learning", Credits: 4, Course_Type: "Core", Dept_ID: 102 },
    { Course_ID: 403, Name: "Digital Electronics", Credits: 3, Course_Type: "Core", Dept_ID: 103 },
    { Course_ID: 404, Name: "Business Analytics", Credits: 3, Course_Type: "Elective", Dept_ID: 104 },
    { Course_ID: 405, Name: "Statistical Methods", Credits: 3, Course_Type: "Core", Dept_ID: 105 },
  ]);
  await db.collection("ASSESSMENT_COMPONENT").insertMany([
    { Course_ID: 401, Component_No: 1, Type: "End-Sem", Max_Marks: 100, Weightage: 100 },
    { Course_ID: 402, Component_No: 1, Type: "End-Sem", Max_Marks: 100, Weightage: 100 },
    { Course_ID: 403, Component_No: 1, Type: "End-Sem", Max_Marks: 100, Weightage: 100 },
    { Course_ID: 404, Component_No: 1, Type: "End-Sem", Max_Marks: 100, Weightage: 100 },
    { Course_ID: 405, Component_No: 1, Type: "End-Sem", Max_Marks: 100, Weightage: 100 },
  ]);
  await db.collection("ENROLLMENT").insertMany([
    { Student_ID: 1001, Course_ID: 401, Year: 2025, Semester: 1, Grade: "A" },
    { Student_ID: 1002, Course_ID: 401, Year: 2025, Semester: 1, Grade: "B" },
    { Student_ID: 1003, Course_ID: 402, Year: 2025, Semester: 1, Grade: "A" },
    { Student_ID: 1004, Course_ID: 403, Year: 2025, Semester: 1, Grade: "B" },
    { Student_ID: 1005, Course_ID: 405, Year: 2025, Semester: 1, Grade: "A" },
  ]);
  await db.collection("ATTENDANCE").insertMany([
    { Attendance_ID: 5001, Student_ID: 1001, Course_ID: 401, Year: 2025, Semester: 1, Att_Date: "2025-01-10", Status: "Present" },
    { Attendance_ID: 5002, Student_ID: 1002, Course_ID: 401, Year: 2025, Semester: 1, Att_Date: "2025-01-10", Status: "Absent" },
    { Attendance_ID: 5003, Student_ID: 1003, Course_ID: 402, Year: 2025, Semester: 1, Att_Date: "2025-01-10", Status: "Present" },
    { Attendance_ID: 5004, Student_ID: 1004, Course_ID: 403, Year: 2025, Semester: 1, Att_Date: "2025-01-10", Status: "Present" },
    { Attendance_ID: 5005, Student_ID: 1005, Course_ID: 405, Year: 2025, Semester: 1, Att_Date: "2025-01-10", Status: "Absent" },
  ]);
  await db.collection("MARKS").insertMany([
    { Student_ID: 1001, Course_ID: 401, Year: 2025, Semester: 1, Component_No: 1, Marks_Obtained: 88 },
    { Student_ID: 1002, Course_ID: 401, Year: 2025, Semester: 1, Component_No: 1, Marks_Obtained: 68 },
    { Student_ID: 1003, Course_ID: 402, Year: 2025, Semester: 1, Component_No: 1, Marks_Obtained: 92 },
    { Student_ID: 1004, Course_ID: 403, Year: 2025, Semester: 1, Component_No: 1, Marks_Obtained: 74 },
    { Student_ID: 1005, Course_ID: 405, Year: 2025, Semester: 1, Component_No: 1, Marks_Obtained: 81 },
  ]);
  await db.collection("TEACHES").insertMany([
    { Course_ID: 401, Year: 2025, Semester: 1, Faculty_ID: 301 },
    { Course_ID: 402, Year: 2025, Semester: 1, Faculty_ID: 303 },
    { Course_ID: 403, Year: 2025, Semester: 1, Faculty_ID: 304 },
    { Course_ID: 404, Year: 2025, Semester: 1, Faculty_ID: 302 },
    { Course_ID: 405, Year: 2025, Semester: 1, Faculty_ID: 305 },
  ]);
  await db.collection("SCHOLARSHIP").insertMany([
    { Scholarship_ID: 601, Name: "Merit Scholarship", Type: "Merit", Amount: 50000, Eligibility: "High academic performance" },
    { Scholarship_ID: 602, Name: "Need Support", Type: "Need-based", Amount: 30000, Eligibility: "Financial need" },
    { Scholarship_ID: 603, Name: "Research Grant", Type: "Research", Amount: 75000, Eligibility: "Approved research work" },
    { Scholarship_ID: 604, Name: "Sports Scholarship", Type: "Sports", Amount: 25000, Eligibility: "Sports achievement" },
    { Scholarship_ID: 605, Name: "Women in STEM", Type: "Merit", Amount: 40000, Eligibility: "Academic performance" },
  ]);
  await db.collection("AWARDED").insertMany([
    { Student_ID: 1001, Scholarship_ID: 601, Year: 2025, Award_Date: "2025-08-05" },
    { Student_ID: 1002, Scholarship_ID: 602, Year: 2025, Award_Date: "2025-08-06" },
    { Student_ID: 1003, Scholarship_ID: 603, Year: 2025, Award_Date: "2025-08-07" },
    { Student_ID: 1004, Scholarship_ID: 604, Year: 2025, Award_Date: "2025-08-08" },
    { Student_ID: 1005, Scholarship_ID: 605, Year: 2025, Award_Date: "2025-08-09" },
  ]);
  await db.collection("HOSTEL").insertMany([
    { Hostel_ID: 701, Name: "A-Block Hostel", Warden: "S. Kumar", Capacity: 200 },
    { Hostel_ID: 702, Name: "B-Block Hostel", Warden: "R. Singh", Capacity: 180 },
    { Hostel_ID: 703, Name: "C-Block Hostel", Warden: "P. Das", Capacity: 150 },
    { Hostel_ID: 704, Name: "D-Block Hostel", Warden: "M. Iyer", Capacity: 120 },
    { Hostel_ID: 705, Name: "E-Block Hostel", Warden: "K. Nair", Capacity: 100 },
  ]);
  await db.collection("ROOM").insertMany([
    { Hostel_ID: 701, Room_No: "101", Capacity: 2, Type: "Double" },
    { Hostel_ID: 701, Room_No: "102", Capacity: 2, Type: "Double" },
    { Hostel_ID: 702, Room_No: "101", Capacity: 2, Type: "Double" },
    { Hostel_ID: 703, Room_No: "101", Capacity: 3, Type: "Triple" },
    { Hostel_ID: 704, Room_No: "101", Capacity: 2, Type: "Double" },
  ]);
  await db.collection("ALLOCATION").insertMany([
    { Student_ID: 1001, Hostel_ID: 701, Room_No: "101", Alloc_Date: "2025-08-10", Vacate_Date: null },
    { Student_ID: 1002, Hostel_ID: 701, Room_No: "102", Alloc_Date: "2025-08-10", Vacate_Date: null },
    { Student_ID: 1003, Hostel_ID: 702, Room_No: "101", Alloc_Date: "2025-08-11", Vacate_Date: null },
    { Student_ID: 1004, Hostel_ID: 703, Room_No: "101", Alloc_Date: "2025-08-12", Vacate_Date: null },
    { Student_ID: 1005, Hostel_ID: 704, Room_No: "101", Alloc_Date: "2025-08-12", Vacate_Date: null },
  ]);
  await db.collection("PROJECT").insertMany([
    { Project_ID: 801, Title: "Smart Campus Analytics", Type: "Research", Start_Date: "2025-01-10", End_Date: "2025-06-30", Host_Org: "ABC Research Lab", Faculty_ID: 301 },
    { Project_ID: 802, Title: "AI for Student Support", Type: "Research", Start_Date: "2025-02-01", End_Date: "2025-08-31", Host_Org: "ABC Innovation Cell", Faculty_ID: 303 },
    { Project_ID: 803, Title: "Embedded Systems Lab", Type: "Research", Start_Date: "2025-03-01", End_Date: "2025-07-31", Host_Org: "ABC Electronics Lab", Faculty_ID: 304 },
    { Project_ID: 804, Title: "Business Intelligence Study", Type: "Research", Start_Date: "2025-03-15", End_Date: null, Host_Org: "ABC Management Cell", Faculty_ID: 302 },
    { Project_ID: 805, Title: "Statistical Research Study", Type: "Research", Start_Date: "2025-04-01", End_Date: null, Host_Org: "DataLab Institute", Faculty_ID: 305 },
  ]);
  await db.collection("UNDERTAKES").insertMany([
    { Student_ID: 1001, Project_ID: 801, Role: "Developer" },
    { Student_ID: 1002, Project_ID: 802, Role: "Analyst" },
    { Student_ID: 1003, Project_ID: 803, Role: "Researcher" },
    { Student_ID: 1004, Project_ID: 804, Role: "Researcher" },
    { Student_ID: 1005, Project_ID: 805, Role: "Researcher" },
  ]);

  console.log(`MongoDB seed complete (${dbName}).`);
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
