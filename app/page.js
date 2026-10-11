import { TABLES, TABLE_NAMES } from "../lib/tables";

export default function Home() {
  return (
    <div>
      <h1>ABC University — Integrated Academic Management</h1>
      <p className="muted">
        Open any table to view rows, insert new rows,
        edit, or delete. Primary-key columns are marked with *.
      </p>
      <h2>All tables (23)</h2>
      <div className="grid">
        {TABLE_NAMES.map((t) => (
          <a key={t} className="card" href={`/tables/${t}`}>
            <b>{TABLES[t].label}</b>
            <span>
              {t} · PK: {TABLES[t].pk.join(", ")}
            </span>
          </a>
        ))}
      </div>
      <h2>How to run</h2>
      <p className="muted">
        1. <code>npm install</code> · 2. <code>npm run db:init</code> (creates + seeds
        SQLite file) · 3. <code>npm run dev</code> (open http://localhost:3000)
      </p>
    </div>
  );
}
