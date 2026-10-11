import { getFacultyDetail } from "../../../lib/lookup";

function KV({ k, v, href }) {
  return (
    <div className="kv">
      <span>{k}</span>
      <b>{href ? <a href={href}>{v}</a> : v ?? "—"}</b>
    </div>
  );
}

export default async function FacultyPage({ params }) {
  const { id } = await params;
  const f = await getFacultyDetail(Number(id));
  if (!f)
    return (
      <div>
        <a className="back" href="/">← Home</a>
        <div className="err">Faculty #{id} not found.</div>
      </div>
    );

  const subtype = f.permanent
    ? [["Salary", f.permanent.salary], ["PF number", f.permanent.pfNumber], ["Confirmed", f.permanent.confirmationDate]]
    : f.adjunct
    ? [["Hourly rate", f.adjunct.hourlyRate], ["Contract ends", f.adjunct.contractEndDate]]
    : f.visiting
    ? [["Home institution", f.visiting.homeInstitution], ["Visit (months)", f.visiting.visitDurationMonths]]
    : [];

  return (
    <div>
      <a className="back" href="/">← Home</a>
      <div className="hero">
        <div>
          <h1 style={{ margin: 0 }}>{f.name}</h1>
          <div className="hint">Faculty #{f.facultyId} · {f.facultyType} · {f.email} · {f.phone || "no phone"}</div>
        </div>
        <div className="stats">
          <div className="stat"><span>Courses taught</span><b>{f.teaches.length}</b></div>
          <div className="stat"><span>Mentees</span><b>{f.mentees.length}</b></div>
          <div className="stat"><span>Projects supervised</span><b>{f.supervised.length}</b></div>
        </div>
      </div>

      <div className="panel">
        <div className="sec-title">Identity & employment</div>
        <div className="kvgrid">
          <KV k="Department" v={f.department.name} />
          <KV k="Date of joining" v={f.doj} />
          <KV k="Type" v={f.facultyType} />
          {subtype.map(([k, v]) => <KV key={k} k={k} v={v} />)}
        </div>
        {f.qualifications.length > 0 && (
          <p className="muted">Qualifications: {f.qualifications.map((q) => q.qualification).join(" · ")}</p>
        )}
      </div>

      <div className="panel">
        <div className="sec-title">Courses taught</div>
        {f.teaches.length === 0 ? <p className="muted">None.</p> : (
          <table className="data">
            <thead><tr><th>Course</th><th>Year</th><th>Sem</th></tr></thead>
            <tbody>
              {f.teaches.map((t) => (
                <tr key={`${t.courseId}-${t.year}-${t.semester}`}>
                  <td><a href={`/courses/${t.courseId}`}>{t.course.name} (#{t.courseId})</a></td>
                  <td>{t.year}</td><td>{t.semester}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <div className="sec-title">Mentees</div>
        {f.mentees.length === 0 ? <p className="muted">None.</p> : (
          <table className="data">
            <thead><tr><th>Student</th><th>Program</th><th>Email</th></tr></thead>
            <tbody>
              {f.mentees.map((m) => (
                <tr key={m.studentId}>
                  <td><a href={`/students/${m.studentId}`}>{m.name} (#{m.studentId})</a></td>
                  <td>{m.program?.name}</td><td>{m.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <div className="sec-title">Projects supervised</div>
        {f.supervised.length === 0 ? <p className="muted">None.</p> : (
          <table className="data">
            <thead><tr><th>Project</th><th>Type</th><th>Period</th></tr></thead>
            <tbody>
              {f.supervised.map((p) => (
                <tr key={p.projectId}>
                  <td>{p.title} (#{p.projectId})</td><td>{p.type}</td>
                  <td>{p.startDate} → {p.endDate ?? "ongoing"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
