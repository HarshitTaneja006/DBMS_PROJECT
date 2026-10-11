// Run: npx prisma db seed   (configured via package.json "prisma.seed")

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.school.count();
  if (existing > 0) {
    console.log("Seed skipped: database already has data.");
    return;
  }

  await prisma.school.createMany({
    data: [
      { schoolId: 1, name: "School of Computing", location: "Chennai" },
      { schoolId: 2, name: "School of Engineering", location: "Chennai" },
      { schoolId: 3, name: "School of Management", location: "Chennai" },
      { schoolId: 4, name: "School of Sciences", location: "Chennai" },
      { schoolId: 5, name: "School of Humanities", location: "Chennai" },
    ],
  });
  await prisma.department.createMany({
    data: [
      { deptId: 101, name: "Computer Science", schoolId: 1 },
      { deptId: 102, name: "Data Science", schoolId: 1 },
      { deptId: 103, name: "Electronics", schoolId: 2 },
      { deptId: 104, name: "Management Studies", schoolId: 3 },
      { deptId: 105, name: "Mathematics", schoolId: 4 },
    ],
  });
  await prisma.program.createMany({
    data: [
      { programId: 201, name: "B.Tech Computer Science", level: "UG", duration: 4, deptId: 101 },
      { programId: 202, name: "M.Tech Artificial Intelligence", level: "PG", duration: 2, deptId: 102 },
      { programId: 203, name: "Ph.D. Data Science", level: "Doctoral", duration: 5, deptId: 102 },
      { programId: 204, name: "B.Tech Electronics", level: "UG", duration: 4, deptId: 103 },
      { programId: 205, name: "B.Sc Mathematics", level: "UG", duration: 3, deptId: 105 },
    ],
  });
  await prisma.faculty.createMany({
    data: [
      { facultyId: 301, name: "Dr. Arun Kumar", email: "arun@abc.edu", phone: "9000000001", doj: "2018-06-10", facultyType: "Permanent", deptId: 101 },
      { facultyId: 302, name: "Dr. Meera Rao", email: "meera@abc.edu", phone: "9000000002", doj: "2019-07-15", facultyType: "Permanent", deptId: 101 },
      { facultyId: 303, name: "Dr. Neha Iyer", email: "neha@abc.edu", phone: "9000000003", doj: "2021-08-01", facultyType: "Adjunct", deptId: 102 },
      { facultyId: 304, name: "Dr. Ravi Menon", email: "ravi@abc.edu", phone: "9000000004", doj: "2022-02-12", facultyType: "Adjunct", deptId: 103 },
      { facultyId: 305, name: "Dr. Priya Nair", email: "priya@abc.edu", phone: "9000000005", doj: "2017-05-18", facultyType: "Visiting", deptId: 105 },
    ],
  });
  await prisma.facultyQualification.createMany({
    data: [
      { facultyId: 301, qualification: "Ph.D. Computer Science" },
      { facultyId: 302, qualification: "Ph.D. Data Science" },
      { facultyId: 303, qualification: "Ph.D. Artificial Intelligence" },
      { facultyId: 304, qualification: "Ph.D. Electronics" },
      { facultyId: 305, qualification: "Ph.D. Mathematics" },
    ],
  });
  await prisma.permanentFaculty.createMany({
    data: [
      { facultyId: 301, salary: 120000, pfNumber: "PF301", confirmationDate: "2020-06-10" },
      { facultyId: 302, salary: 115000, pfNumber: "PF302", confirmationDate: "2021-07-15" },
    ],
  });
  await prisma.adjunctFaculty.createMany({
    data: [
      { facultyId: 303, hourlyRate: 1800, contractEndDate: "2027-06-30" },
      { facultyId: 304, hourlyRate: 2000, contractEndDate: "2027-12-31" },
    ],
  });
  await prisma.visitingFaculty.create({
    data: { facultyId: 305, homeInstitution: "IIT Madras", visitDurationMonths: 12 },
  });
  await prisma.student.createMany({
    data: [
      { studentId: 1001, name: "Aarav Singh", dob: "2005-04-12", gender: "M", address: "Chennai", email: "aarav@abc.edu", enrollmentYear: 2025, programId: 201, mentorFacultyId: 301, mentorStartDate: "2025-08-01" },
      { studentId: 1002, name: "Diya Sharma", dob: "2005-09-20", gender: "F", address: "Chennai", email: "diya@abc.edu", enrollmentYear: 2025, programId: 201, mentorFacultyId: 302, mentorStartDate: "2025-08-01" },
      { studentId: 1003, name: "Kabir Patel", dob: "2001-03-05", gender: "M", address: "Bengaluru", email: "kabir@abc.edu", enrollmentYear: 2025, programId: 202, mentorFacultyId: 303, mentorStartDate: "2025-08-01" },
      { studentId: 1004, name: "Ananya Das", dob: "2000-11-11", gender: "F", address: "Kolkata", email: "ananya@abc.edu", enrollmentYear: 2025, programId: 204, mentorFacultyId: 304, mentorStartDate: "2025-08-01" },
      { studentId: 1005, name: "Rohan Gupta", dob: "1999-07-08", gender: "M", address: "Delhi", email: "rohan@abc.edu", enrollmentYear: 2025, programId: 205, mentorFacultyId: 305, mentorStartDate: "2025-08-01" },
    ],
  });
  await prisma.studentPhone.createMany({
    data: [
      { studentId: 1001, phone: "9100000001" },
      { studentId: 1002, phone: "9100000002" },
      { studentId: 1003, phone: "9100000003" },
      { studentId: 1004, phone: "9100000004" },
      { studentId: 1005, phone: "9100000005" },
    ],
  });
  await prisma.course.createMany({
    data: [
      { courseId: 401, name: "Database Systems", credits: 4, courseType: "Core", deptId: 101 },
      { courseId: 402, name: "Machine Learning", credits: 4, courseType: "Core", deptId: 102 },
      { courseId: 403, name: "Digital Electronics", credits: 3, courseType: "Core", deptId: 103 },
      { courseId: 404, name: "Business Analytics", credits: 3, courseType: "Elective", deptId: 104 },
      { courseId: 405, name: "Statistical Methods", credits: 3, courseType: "Core", deptId: 105 },
    ],
  });
  await prisma.assessmentComponent.createMany({
    data: [
      { courseId: 401, componentNo: 1, type: "End-Sem", maxMarks: 100, weightage: 100 },
      { courseId: 402, componentNo: 1, type: "End-Sem", maxMarks: 100, weightage: 100 },
      { courseId: 403, componentNo: 1, type: "End-Sem", maxMarks: 100, weightage: 100 },
      { courseId: 404, componentNo: 1, type: "End-Sem", maxMarks: 100, weightage: 100 },
      { courseId: 405, componentNo: 1, type: "End-Sem", maxMarks: 100, weightage: 100 },
    ],
  });
  await prisma.enrollment.createMany({
    data: [
      { studentId: 1001, courseId: 401, year: 2025, semester: 1, grade: "A" },
      { studentId: 1002, courseId: 401, year: 2025, semester: 1, grade: "B" },
      { studentId: 1003, courseId: 402, year: 2025, semester: 1, grade: "A" },
      { studentId: 1004, courseId: 403, year: 2025, semester: 1, grade: "B" },
      { studentId: 1005, courseId: 405, year: 2025, semester: 1, grade: "A" },
    ],
  });
  await prisma.attendance.createMany({
    data: [
      { attendanceId: 5001, studentId: 1001, courseId: 401, year: 2025, semester: 1, attDate: "2025-01-10", status: "Present" },
      { attendanceId: 5002, studentId: 1002, courseId: 401, year: 2025, semester: 1, attDate: "2025-01-10", status: "Absent" },
      { attendanceId: 5003, studentId: 1003, courseId: 402, year: 2025, semester: 1, attDate: "2025-01-10", status: "Present" },
      { attendanceId: 5004, studentId: 1004, courseId: 403, year: 2025, semester: 1, attDate: "2025-01-10", status: "Present" },
      { attendanceId: 5005, studentId: 1005, courseId: 405, year: 2025, semester: 1, attDate: "2025-01-10", status: "Absent" },
    ],
  });
  await prisma.marks.createMany({
    data: [
      { studentId: 1001, courseId: 401, year: 2025, semester: 1, componentNo: 1, marksObtained: 88 },
      { studentId: 1002, courseId: 401, year: 2025, semester: 1, componentNo: 1, marksObtained: 68 },
      { studentId: 1003, courseId: 402, year: 2025, semester: 1, componentNo: 1, marksObtained: 92 },
      { studentId: 1004, courseId: 403, year: 2025, semester: 1, componentNo: 1, marksObtained: 74 },
      { studentId: 1005, courseId: 405, year: 2025, semester: 1, componentNo: 1, marksObtained: 81 },
    ],
  });
  await prisma.teaches.createMany({
    data: [
      { courseId: 401, year: 2025, semester: 1, facultyId: 301 },
      { courseId: 402, year: 2025, semester: 1, facultyId: 303 },
      { courseId: 403, year: 2025, semester: 1, facultyId: 304 },
      { courseId: 404, year: 2025, semester: 1, facultyId: 302 },
      { courseId: 405, year: 2025, semester: 1, facultyId: 305 },
    ],
  });
  await prisma.scholarship.createMany({
    data: [
      { scholarshipId: 601, name: "Merit Scholarship", type: "Merit", amount: 50000, eligibility: "High academic performance" },
      { scholarshipId: 602, name: "Need Support", type: "Need-based", amount: 30000, eligibility: "Financial need" },
      { scholarshipId: 603, name: "Research Grant", type: "Research", amount: 75000, eligibility: "Approved research work" },
      { scholarshipId: 604, name: "Sports Scholarship", type: "Sports", amount: 25000, eligibility: "Sports achievement" },
      { scholarshipId: 605, name: "Women in STEM", type: "Merit", amount: 40000, eligibility: "Academic performance" },
    ],
  });
  await prisma.awarded.createMany({
    data: [
      { studentId: 1001, scholarshipId: 601, year: 2025, awardDate: "2025-08-05" },
      { studentId: 1002, scholarshipId: 602, year: 2025, awardDate: "2025-08-06" },
      { studentId: 1003, scholarshipId: 603, year: 2025, awardDate: "2025-08-07" },
      { studentId: 1004, scholarshipId: 604, year: 2025, awardDate: "2025-08-08" },
      { studentId: 1005, scholarshipId: 605, year: 2025, awardDate: "2025-08-09" },
    ],
  });
  await prisma.hostel.createMany({
    data: [
      { hostelId: 701, name: "A-Block Hostel", warden: "S. Kumar", capacity: 200 },
      { hostelId: 702, name: "B-Block Hostel", warden: "R. Singh", capacity: 180 },
      { hostelId: 703, name: "C-Block Hostel", warden: "P. Das", capacity: 150 },
      { hostelId: 704, name: "D-Block Hostel", warden: "M. Iyer", capacity: 120 },
      { hostelId: 705, name: "E-Block Hostel", warden: "K. Nair", capacity: 100 },
    ],
  });
  await prisma.room.createMany({
    data: [
      { hostelId: 701, roomNo: "101", capacity: 2, type: "Double" },
      { hostelId: 701, roomNo: "102", capacity: 2, type: "Double" },
      { hostelId: 702, roomNo: "101", capacity: 2, type: "Double" },
      { hostelId: 703, roomNo: "101", capacity: 3, type: "Triple" },
      { hostelId: 704, roomNo: "101", capacity: 2, type: "Double" },
    ],
  });
  await prisma.allocation.createMany({
    data: [
      { studentId: 1001, hostelId: 701, roomNo: "101", allocDate: "2025-08-10", vacateDate: null },
      { studentId: 1002, hostelId: 701, roomNo: "102", allocDate: "2025-08-10", vacateDate: null },
      { studentId: 1003, hostelId: 702, roomNo: "101", allocDate: "2025-08-11", vacateDate: null },
      { studentId: 1004, hostelId: 703, roomNo: "101", allocDate: "2025-08-12", vacateDate: null },
      { studentId: 1005, hostelId: 704, roomNo: "101", allocDate: "2025-08-12", vacateDate: null },
    ],
  });
  await prisma.project.createMany({
    data: [
      { projectId: 801, title: "Smart Campus Analytics", type: "Research", startDate: "2025-01-10", endDate: "2025-06-30", hostOrg: "ABC Research Lab", facultyId: 301 },
      { projectId: 802, title: "AI for Student Support", type: "Research", startDate: "2025-02-01", endDate: "2025-08-31", hostOrg: "ABC Innovation Cell", facultyId: 303 },
      { projectId: 803, title: "Embedded Systems Lab", type: "Research", startDate: "2025-03-01", endDate: "2025-07-31", hostOrg: "ABC Electronics Lab", facultyId: 304 },
      { projectId: 804, title: "Business Intelligence Study", type: "Research", startDate: "2025-03-15", endDate: null, hostOrg: "ABC Management Cell", facultyId: 302 },
      { projectId: 805, title: "Statistical Research Study", type: "Research", startDate: "2025-04-01", endDate: null, hostOrg: "DataLab Institute", facultyId: 305 },
    ],
  });
  await prisma.undertakes.createMany({
    data: [
      { studentId: 1001, projectId: 801, role: "Developer" },
      { studentId: 1002, projectId: 802, role: "Analyst" },
      { studentId: 1003, projectId: 803, role: "Researcher" },
      { studentId: 1004, projectId: 804, role: "Researcher" },
      { studentId: 1005, projectId: 805, role: "Researcher" },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
