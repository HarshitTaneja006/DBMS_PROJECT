"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

function keyOf(pk, row) {
  return pk.map((k) => String(row[k] ?? "")).join(" | ");
}

export default function TablePage() {
  const { name } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({});
  const [editKey, setEditKey] = useState(null);
  const [editRow, setEditRow] = useState({});

  async function load() {
    setErr("");
    setMsg("");
    try {
      const r = await fetch(`/api/tables/${name}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Load failed");
      setData(j);
      const blank = {};
      for (const c of j.columns) blank[c.name] = "";
      setForm(blank);
    } catch (e) {
      setErr(String(e.message));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  async function addRow(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const r = await fetch(`/api/tables/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Insert failed");
      setMsg("Row inserted.");
      load();
    } catch (e2) {
      setErr(String(e2.message));
    }
  }

  async function delRow(row) {
    if (!confirm("Delete this row?")) return;
    setErr("");
    setMsg("");
    try {
      const q = new URLSearchParams();
      for (const k of data.pk) q.set(k, row[k] ?? "");
      const r = await fetch(`/api/tables/${name}?${q.toString()}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Delete failed");
      setMsg("Row deleted.");
      load();
    } catch (e) {
      setErr(String(e.message));
    }
  }

  function startEdit(row) {
    setEditKey(keyOf(data.pk, row));
    setEditRow({ ...row });
  }

  async function saveEdit(orig) {
    setErr("");
    setMsg("");
    try {
      const key = {};
      for (const k of data.pk) key[k] = orig[k];
      const r = await fetch(`/api/tables/${name}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, row: editRow }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Update failed");
      setMsg("Row updated.");
      setEditKey(null);
      load();
    } catch (e) {
      setErr(String(e.message));
    }
  }

  if (err && !data)
    return (
      <div>
        <a className="back" href="/">
          ← All tables
        </a>
        <h1>{name}</h1>
        <div className="err">{err} (Did you run: npm run db:init ?)</div>
      </div>
    );
  if (!data) return <div>Loading {name} …</div>;

  return (
    <div>
      <a className="back" href="/">
        ← All tables
      </a>
      <h1>
        {name} <span className="hint">({data.rows.length} rows · PK: {data.pk.join(", ")})</span>
      </h1>
      {err && <div className="err">{err}</div>}
      {msg && <div className="ok">{msg}</div>}

      <fieldset>
        <legend>Add row (leave blank = NULL)</legend>
        <form onSubmit={addRow}>
          <div className="formgrid">
            {data.columns.map((c) => (
              <label key={c.name}>
                {c.name}
                {data.pk.includes(c.name) ? " *" : ""} <span className="hint">({c.type})</span>
                <input
                  value={form[c.name] ?? ""}
                  onChange={(e) => setForm({ ...form, [c.name]: e.target.value })}
                  placeholder={c.type + (data.pk.includes(c.name) ? " (PK)" : "")}
                />
              </label>
            ))}
          </div>
          <button className="primary" type="submit">
            Insert
          </button>
        </form>
      </fieldset>

      <div style={{ overflowX: "auto" }}>
        <table className="data">
          <thead>
            <tr>
              {data.columns.map((c) => (
                <th key={c.name}>{c.name}</th>
              ))}
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => {
              const k = keyOf(data.pk, row);
              const editing = editKey === k;
              return (
                <tr key={i} className={editing ? "editing" : ""}>
                  {data.columns.map((c) => (
                    <td key={c.name}>
                      {editing && !data.pk.includes(c.name) ? (
                        <input
                          value={editRow[c.name] ?? ""}
                          onChange={(e) => setEditRow({ ...editRow, [c.name]: e.target.value })}
                        />
                      ) : (
                        String(row[c.name] ?? "")
                      )}
                    </td>
                  ))}
                  <td>
                    {editing ? (
                      <>
                        <button onClick={() => saveEdit(row)}>Save</button>{" "}
                        <button onClick={() => setEditKey(null)}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(row)}>Edit</button>
                    )}
                  </td>
                  <td>
                    <button onClick={() => delRow(row)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {data.rows.length === 0 && <p className="muted">No rows yet — use the form above to insert.</p>}
      <p className="hint">
        PK columns (*) cannot be edited after insert (standard SQL rule). To change a PK, delete and
        re-insert the row. Dates: use YYYY-MM-DD. Foreign-key violations are rejected by SQLite.
      </p>
    </div>
  );
}
