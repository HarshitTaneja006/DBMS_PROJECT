"use client";

import { useState } from "react";

const SCOPES = [
  { key: "all", label: "All" },
  { key: "student", label: "Students" },
  { key: "faculty", label: "Faculty" },
  { key: "course", label: "Courses" },
];

function Group({ title, items, base }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="sec-title">{title}</div>
      <table className="data">
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>
                <a href={`${base}/${it.id}`}>
                  <b>{it.title}</b>
                </a>
                <div className="hint">{it.sub}</div>
              </td>
              <td style={{ whiteSpace: "nowrap" }}>
                <a className="btn" href={`${base}/${it.id}`}>
                  Open →
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SearchBox() {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState("all");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);

  async function run(nextQ = q, nextScope = scope) {
    if (String(nextQ).trim().length < 1) {
      setRes(null);
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(
        `/api/search?q=${encodeURIComponent(nextQ)}&scope=${nextScope}`
      );
      setRes(await r.json());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <div className="toolbar" style={{ margin: "0 0 8px 0" }}>
          {SCOPES.map((s) => (
            <button
              key={s.key}
              type="button"
              className={scope === s.key ? "primary" : ""}
              onClick={() => {
                setScope(s.key);
                run(q, s.key);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              run(e.target.value, scope);
            }}
            placeholder="Type a name, email or ID… e.g. Aarav, arun@abc.edu, 1001"
          />
          <button className="primary" type="submit" style={{ width: "auto" }}>
            Search
          </button>
        </div>
      </form>
      {busy && <p className="hint">Searching…</p>}
      {res && (
        <div style={{ marginTop: 10 }}>
          {res.students?.length + res.faculty?.length + res.courses?.length === 0 && (
            <p className="muted">No matches for “{res.q}”.</p>
          )}
          <Group title="Students" items={res.students} base="/students" />
          <Group title="Faculty" items={res.faculty} base="/faculty" />
          <Group title="Courses" items={res.courses} base="/courses" />
        </div>
      )}
    </div>
  );
}
