import { getStudentDetail } from "../../../lib/lookup";

function KV({ k, v, href }) {
  return (
    <div className="kv">
      <span>{k}</span>
      <b>{href ? <a href={href}>{v}</a> : v ?? "-"}</b>
    </div>
  );
}

export default async function StudentPage({ params }) {
  const { id } = await params;
  const s = await getStudentDetail(Number(id));
  if (!s)
    return (
      <div>
        <a className="back" href="/">← Home</a>
        <div className="err">Student #{id} not found.</div>
      </div>
    );

  return (
    <div>
      <a className="back" href="/">← Home</a>
      <div className="hero">
        <div>
          <h1 style={{ margin: 0 }}>{s.name}</h1>
          <div className="hint">
            Student #{s.studentId} · {s.email} · {s.phones.map((p) => p.phone).join(", ") || "no phone"}
          </div>
        </div>
        <div className="stats">
          <div className="stat"><span>Avg marks</span><b>{s.avgMarks ?? "-"}</b></div>
          <div className="stat"><span>Attendance</span><b>{s.attendancePct !== null ? `${s.attendancePct}%` : "-"}</b></div>
          <div className="stat"><span>Courses</span><b>{s.enrollments.length}</b></div>
          <div className="stat"><span>Completed</span><b>{s.completed}</b></div>
        </div>
      </div>

      <div className="panel">
        <div className="sec-title">Identity & program</div>
        <div className="kvgrid">
          <KV k="DOB" v={s.dob} />
          <KV k="Gender" v={s.gender} />
          <KV k="Address" v={s.address} />
          <KV k="Enrollment year" v={s.enrollmentYear} />
          <KV k="Program" v={`${s.program.name} (${s.program.level})`} />
          <KV k="Department" v={s.program.department.name} />
          <KV k="School" v={s.program.department.school.name} />
          <KV k="Mentor" v={s.mentor ? `${s.mentor.name} (#${s.mentor.facultyId})` : "-"} href={s.mentor ? `/faculty/${s.mentor.facultyId}` : null} />
        </div>
      </div>

      <div className="panel">
        <div className="sec-title">Enrollments & grades</div>
        <table className="data">
          <thead><tr><th>Course</th><th>Year</th><th>Sem</th><th>Grade</th></tr></thead>
          <tbody>
            {s.enrollments.map((e) => (
              <tr key={`${e.courseId}-${e.year}-${e.semester}`}>
                <td><a href={`/courses/${e.courseId}`}>{e.course.name} (#{e.courseId})</a></td>
                <td>{e.year}</td><td>{e.semester}</td><td>{e.grade ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div className="sec-title">Marks per assessment</div>
        <table className="data">
          <thead><tr><th>Course</th><th>Component</th><th>Type</th><th>Obtained / Max</th></tr></thead>
          <tbody>
            {s.marks.map((m) => (
              <tr key={`${m.courseId}-${m.componentNo}`}>
                <td><a href={`/courses/${m.courseId}`}>#{m.courseId}</a></td>
                <td>{m.componentNo}</td><td>{m.component.type}</td>
                <td>{m.marksObtained} / {m.component.maxMarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div className="sec-title">Attendance by course</div>
        <table className="data">
          <thead><tr><th>Course</th><th>Present</th><th>Total</th><th>%</th></tr></thead>
          <tbody>
            {s.attendanceByCourse.map((a) => (
              <tr key={a.courseId}>
                <td><a href={`/courses/${a.courseId}`}>{a.courseName || `#${a.courseId}`}</a></td>
                <td>{a.present}</td><td>{a.total}</td><td>{a.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div className="sec-title">Scholarships</div>
        {s.awarded.length === 0 ? <p className="muted">None awarded.</p> : (
          <table className="data">
            <thead><tr><th>Scholarship</th><th>Type</th><th>Amount</th><th>Year</th><th>Award date</th></tr></thead>
            <tbody>
              {s.awarded.map((a) => (
                <tr key={`${a.scholarshipId}-${a.year}`}>
                  <td>{a.scholarship.name}</td><td>{a.scholarship.type}</td>
                  <td>{a.scholarship.amount}</td><td>{a.year}</td><td>{a.awardDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <div className="sec-title">Hostel & projects</div>
        {s.allocations.length === 0 ? <p className="muted">No hostel allocation.</p> : (
          <table className="data">
            <thead><tr><th>Hostel</th><th>Room</th><th>From</th><th>To</th></tr></thead>
            <tbody>
              {s.allocations.map((a, i) => (
                <tr key={i}>
                  <td>{a.room.hostel.name}</td><td>{a.roomNo} ({a.room.type})</td>
                  <td>{a.allocDate}</td><td>{a.vacateDate ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {s.undertakes.length > 0 && (
          <table className="data">
            <thead><tr><th>Project</th><th>Role</th></tr></thead>
            <tbody>
              {s.undertakes.map((u) => (
                <tr key={u.projectId}>
                  <td>{u.project.title} (#{u.projectId})</td><td>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
