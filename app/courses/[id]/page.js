import { getCourseDetail } from "../../../lib/lookup";

function KV({ k, v }) {
  return (
    <div className="kv">
      <span>{k}</span>
      <b>{v ?? "-"}</b>
    </div>
  );
}

export default async function CoursePage({ params }) {
  const { id } = await params;
  const c = await getCourseDetail(Number(id));
  if (!c)
    return (
      <div>
        <a className="back" href="/">← Home</a>
        <div className="err">Course #{id} not found.</div>
      </div>
    );

  return (
    <div>
      <a className="back" href="/">← Home</a>
      <div className="hero">
        <div>
          <h1 style={{ margin: 0 }}>{c.name}</h1>
          <div className="hint">Course #{c.courseId} · {c.credits} credits · {c.courseType} · {c.department.name}</div>
        </div>
        <div className="stats">
          <div className="stat"><span>Enrolled</span><b>{c.enrollments.length}</b></div>
          <div className="stat"><span>Avg marks</span><b>{c.stats?.avg ?? "-"}</b></div>
          <div className="stat"><span>Min / Max</span><b>{c.stats ? `${c.stats.min} / ${c.stats.max}` : "-"}</b></div>
          <div className="stat"><span>Attendance</span><b>{c.attendanceTotal ? `${c.attendancePresent}/${c.attendanceTotal}` : "-"}</b></div>
        </div>
      </div>

      <div className="panel">
        <div className="sec-title">Assessment components</div>
        <table className="data">
          <thead><tr><th>#</th><th>Type</th><th>Max marks</th><th>Weightage %</th></tr></thead>
          <tbody>
            {c.components.map((a) => (
              <tr key={a.componentNo}>
                <td>{a.componentNo}</td><td>{a.type}</td><td>{a.maxMarks}</td><td>{a.weightage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div className="sec-title">Taught by</div>
        {c.teaches.length === 0 ? <p className="muted">No teaching record.</p> : (
          <table className="data">
            <thead><tr><th>Faculty</th><th>Year</th><th>Sem</th></tr></thead>
            <tbody>
              {c.teaches.map((t) => (
                <tr key={`${t.facultyId}-${t.year}-${t.semester}`}>
                  <td><a href={`/faculty/${t.facultyId}`}>{t.faculty.name} (#{t.facultyId})</a></td>
                  <td>{t.year}</td><td>{t.semester}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <div className="sec-title">Enrolled students & grades</div>
        {c.enrollments.length === 0 ? <p className="muted">Nobody enrolled.</p> : (
          <table className="data">
            <thead><tr><th>Student</th><th>Year</th><th>Sem</th><th>Grade</th></tr></thead>
            <tbody>
              {c.enrollments.map((e) => (
                <tr key={`${e.studentId}-${e.year}-${e.semester}`}>
                  <td><a href={`/students/${e.studentId}`}>{e.student.name} (#{e.studentId})</a></td>
                  <td>{e.year}</td><td>{e.semester}</td><td>{e.grade ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
