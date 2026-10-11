-- CreateTable: exact 23-relation DA2 schema (SQLite).
-- CHECK constraints and ON DELETE actions are defined here because
-- Prisma schema cannot express CHECKs. Do not regenerate with
-- `migrate dev` unless you re-apply these CHECKs afterwards.
PRAGMA foreign_keys=off;

CREATE TABLE "SCHOOL" (
  "School_ID" INTEGER PRIMARY KEY,
  "Name" TEXT NOT NULL,
  "Location" TEXT NOT NULL
);
CREATE TABLE "DEPARTMENT" (
  "Dept_ID" INTEGER PRIMARY KEY,
  "Name" TEXT NOT NULL,
  "School_ID" INTEGER NOT NULL REFERENCES "SCHOOL"("School_ID")
);
CREATE TABLE "PROGRAM" (
  "Program_ID" INTEGER PRIMARY KEY,
  "Name" TEXT NOT NULL,
  "Level" TEXT NOT NULL CHECK ("Level" IN ('UG','PG','Doctoral')),
  "Duration" INTEGER NOT NULL CHECK ("Duration" > 0),
  "Dept_ID" INTEGER NOT NULL REFERENCES "DEPARTMENT"("Dept_ID")
);
CREATE TABLE "FACULTY" (
  "Faculty_ID" INTEGER PRIMARY KEY,
  "Name" TEXT NOT NULL,
  "Email" TEXT NOT NULL UNIQUE,
  "Phone" TEXT,
  "DOJ" TEXT NOT NULL,
  "Faculty_Type" TEXT NOT NULL CHECK ("Faculty_Type" IN ('Permanent','Adjunct','Visiting')),
  "Dept_ID" INTEGER NOT NULL REFERENCES "DEPARTMENT"("Dept_ID")
);
CREATE TABLE "STUDENT" (
  "Student_ID" INTEGER PRIMARY KEY,
  "Name" TEXT NOT NULL,
  "DOB" TEXT NOT NULL,
  "Gender" TEXT,
  "Address" TEXT,
  "Email" TEXT NOT NULL UNIQUE,
  "Enrollment_Year" INTEGER NOT NULL,
  "Program_ID" INTEGER NOT NULL REFERENCES "PROGRAM"("Program_ID"),
  "Mentor_Faculty_ID" INTEGER REFERENCES "FACULTY"("Faculty_ID"),
  "Mentor_Start_Date" TEXT
);
CREATE TABLE "STUDENT_PHONE" (
  "Student_ID" INTEGER,
  "Phone" TEXT,
  PRIMARY KEY ("Student_ID", "Phone"),
  FOREIGN KEY ("Student_ID") REFERENCES "STUDENT"("Student_ID")
);
CREATE TABLE "FACULTY_QUALIFICATION" (
  "Faculty_ID" INTEGER,
  "Qualification" TEXT,
  PRIMARY KEY ("Faculty_ID", "Qualification"),
  FOREIGN KEY ("Faculty_ID") REFERENCES "FACULTY"("Faculty_ID")
);
CREATE TABLE "PERMANENT_FACULTY" (
  "Faculty_ID" INTEGER PRIMARY KEY REFERENCES "FACULTY"("Faculty_ID"),
  "Salary" REAL NOT NULL,
  "PF_Number" TEXT NOT NULL UNIQUE,
  "Confirmation_Date" TEXT
);
CREATE TABLE "ADJUNCT_FACULTY" (
  "Faculty_ID" INTEGER PRIMARY KEY REFERENCES "FACULTY"("Faculty_ID"),
  "Hourly_Rate" REAL NOT NULL,
  "Contract_End_Date" TEXT NOT NULL
);
CREATE TABLE "VISITING_FACULTY" (
  "Faculty_ID" INTEGER PRIMARY KEY REFERENCES "FACULTY"("Faculty_ID"),
  "Home_Institution" TEXT NOT NULL,
  "Visit_Duration_Months" INTEGER NOT NULL
);
CREATE TABLE "COURSE" (
  "Course_ID" INTEGER PRIMARY KEY,
  "Name" TEXT NOT NULL,
  "Credits" INTEGER NOT NULL CHECK ("Credits" > 0),
  "Course_Type" TEXT NOT NULL CHECK ("Course_Type" IN ('Core','Elective')),
  "Dept_ID" INTEGER NOT NULL REFERENCES "DEPARTMENT"("Dept_ID")
);
CREATE TABLE "ASSESSMENT_COMPONENT" (
  "Course_ID" INTEGER,
  "Component_No" INTEGER,
  "Type" TEXT NOT NULL,
  "Max_Marks" REAL NOT NULL CHECK ("Max_Marks" > 0),
  "Weightage" REAL NOT NULL CHECK ("Weightage" > 0 AND "Weightage" <= 100),
  PRIMARY KEY ("Course_ID", "Component_No"),
  FOREIGN KEY ("Course_ID") REFERENCES "COURSE"("Course_ID") ON DELETE CASCADE
);
CREATE TABLE "ENROLLMENT" (
  "Student_ID" INTEGER,
  "Course_ID" INTEGER,
  "Year" INTEGER,
  "Semester" INTEGER,
  "Grade" TEXT,
  PRIMARY KEY ("Student_ID", "Course_ID", "Year", "Semester"),
  FOREIGN KEY ("Student_ID") REFERENCES "STUDENT"("Student_ID"),
  FOREIGN KEY ("Course_ID") REFERENCES "COURSE"("Course_ID"),
  CHECK ("Semester" IN (1,2))
);
CREATE TABLE "ATTENDANCE" (
  "Attendance_ID" INTEGER PRIMARY KEY,
  "Student_ID" INTEGER NOT NULL REFERENCES "STUDENT"("Student_ID"),
  "Course_ID" INTEGER NOT NULL REFERENCES "COURSE"("Course_ID"),
  "Year" INTEGER NOT NULL,
  "Semester" INTEGER NOT NULL CHECK ("Semester" IN (1,2)),
  "Att_Date" TEXT NOT NULL,
  "Status" TEXT NOT NULL CHECK ("Status" IN ('Present','Absent')),
  UNIQUE ("Student_ID", "Course_ID", "Att_Date")
);
CREATE TABLE "MARKS" (
  "Student_ID" INTEGER,
  "Course_ID" INTEGER,
  "Year" INTEGER,
  "Semester" INTEGER,
  "Component_No" INTEGER,
  "Marks_Obtained" REAL NOT NULL CHECK ("Marks_Obtained" >= 0),
  PRIMARY KEY ("Student_ID", "Course_ID", "Year", "Semester", "Component_No"),
  FOREIGN KEY ("Student_ID", "Course_ID", "Year", "Semester")
    REFERENCES "ENROLLMENT"("Student_ID", "Course_ID", "Year", "Semester"),
  FOREIGN KEY ("Course_ID", "Component_No")
    REFERENCES "ASSESSMENT_COMPONENT"("Course_ID", "Component_No")
);
CREATE TABLE "TEACHES" (
  "Course_ID" INTEGER,
  "Year" INTEGER,
  "Semester" INTEGER,
  "Faculty_ID" INTEGER NOT NULL REFERENCES "FACULTY"("Faculty_ID"),
  PRIMARY KEY ("Course_ID", "Year", "Semester"),
  FOREIGN KEY ("Course_ID") REFERENCES "COURSE"("Course_ID"),
  CHECK ("Semester" IN (1,2))
);
CREATE TABLE "SCHOLARSHIP" (
  "Scholarship_ID" INTEGER PRIMARY KEY,
  "Name" TEXT NOT NULL,
  "Type" TEXT NOT NULL,
  "Amount" REAL NOT NULL CHECK ("Amount" > 0),
  "Eligibility" TEXT
);
CREATE TABLE "AWARDED" (
  "Student_ID" INTEGER,
  "Scholarship_ID" INTEGER,
  "Year" INTEGER,
  "Award_Date" TEXT NOT NULL,
  PRIMARY KEY ("Student_ID", "Scholarship_ID", "Year"),
  FOREIGN KEY ("Student_ID") REFERENCES "STUDENT"("Student_ID"),
  FOREIGN KEY ("Scholarship_ID") REFERENCES "SCHOLARSHIP"("Scholarship_ID")
);
CREATE TABLE "HOSTEL" (
  "Hostel_ID" INTEGER PRIMARY KEY,
  "Name" TEXT NOT NULL,
  "Warden" TEXT NOT NULL,
  "Capacity" INTEGER NOT NULL CHECK ("Capacity" > 0)
);
CREATE TABLE "ROOM" (
  "Hostel_ID" INTEGER,
  "Room_No" TEXT,
  "Capacity" INTEGER NOT NULL CHECK ("Capacity" > 0),
  "Type" TEXT NOT NULL,
  PRIMARY KEY ("Hostel_ID", "Room_No"),
  FOREIGN KEY ("Hostel_ID") REFERENCES "HOSTEL"("Hostel_ID") ON DELETE CASCADE
);
CREATE TABLE "ALLOCATION" (
  "Student_ID" INTEGER,
  "Hostel_ID" INTEGER,
  "Room_No" TEXT,
  "Alloc_Date" TEXT,
  "Vacate_Date" TEXT,
  PRIMARY KEY ("Student_ID", "Hostel_ID", "Room_No", "Alloc_Date"),
  FOREIGN KEY ("Student_ID") REFERENCES "STUDENT"("Student_ID"),
  FOREIGN KEY ("Hostel_ID", "Room_No") REFERENCES "ROOM"("Hostel_ID", "Room_No"),
  CHECK ("Vacate_Date" IS NULL OR "Vacate_Date" >= "Alloc_Date")
);
CREATE TABLE "PROJECT" (
  "Project_ID" INTEGER PRIMARY KEY,
  "Title" TEXT NOT NULL,
  "Type" TEXT NOT NULL,
  "Start_Date" TEXT NOT NULL,
  "End_Date" TEXT,
  "Host_Org" TEXT,
  "Faculty_ID" INTEGER REFERENCES "FACULTY"("Faculty_ID") ON DELETE SET NULL,
  CHECK ("End_Date" IS NULL OR "End_Date" >= "Start_Date")
);
CREATE TABLE "UNDERTAKES" (
  "Student_ID" INTEGER,
  "Project_ID" INTEGER,
  "Role" TEXT NOT NULL,
  PRIMARY KEY ("Student_ID", "Project_ID"),
  FOREIGN KEY ("Student_ID") REFERENCES "STUDENT"("Student_ID"),
  FOREIGN KEY ("Project_ID") REFERENCES "PROJECT"("Project_ID")
);

PRAGMA foreign_keys=on;
