import { TABLES, TABLE_NAMES } from "../lib/tables";
import SearchBox from "../components/SearchBox";

export default function Home() {
  return (
    <div>
      <h1>ABC University - Integrated Academic Management</h1>
      <p className="muted">
        Open any table to view rows, insert new rows,
        edit, or delete. Primary-key columns are marked with *.
        Foreign-key columns offer dropdowns of valid values.
      </p>
      <h2>Find a student, faculty member or course</h2>
      <SearchBox />
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
    </div>
  );
}
