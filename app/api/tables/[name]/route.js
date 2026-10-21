import { NextResponse } from "next/server";
import { TABLES, FK_REFS } from "../../../../lib/tables";
import {
  findOne,
  findMany,
  insertDoc,
  updateDoc,
  deleteDoc,
  pkSort,
  friendlyCouchError,
} from "../../../../lib/couch";

// Generic CRUD over CouchDB documents. Documents use DB column names
// (School_ID, Name, ...) so the UI contract is unchanged.

function coerce(colDef, v) {
  if (v === "" || v === undefined || v === null) return null;
  if (colDef.type === "INTEGER") {
    const n = Number(v);
    if (!Number.isInteger(n)) throw new Error(`"${colDef.name}" must be an integer, got "${v}"`);
    return n;
  }
  if (colDef.type === "REAL") {
    const n = Number(v);
    if (Number.isNaN(n)) throw new Error(`"${colDef.name}" must be a number, got "${v}"`);
    return n;
  }
  return String(v);
}

function toDoc(def, obj) {
  const doc = {};
  for (const c of def.columns) doc[c.name] = coerce(c, obj[c.name]);
  return doc;
}

// Validate single-column and composite foreign keys against CouchDB documents.
async function checkFKs(table, doc) {
  const refs = FK_REFS[table] || {};
  for (const [col, refTable] of Object.entries(refs)) {
    const v = doc[col];
    if (v === null || v === undefined || v === "") continue;
    const parentDef = TABLES[refTable];
    let exists = null;
    if (parentDef.pk.length === 1) {
      exists = await findOne(refTable, { [parentDef.pk[0]]: v });
    } else {
      const shared = parentDef.pk.find((k) => k === col) || parentDef.pk[0];
      exists = await findOne(refTable, { [shared]: v });
    }
    if (!exists) {
      const err = new Error(`Foreign key violation: ${table}.${col}=${v} has no ${refTable} parent.`);
      err.code = "FK_VIOLATION";
      throw err;
    }
  }

  // Composite foreign keys from the schema:
  if (table === "MARKS") {
    const enroll = await findOne("ENROLLMENT", {
      Student_ID: doc.Student_ID,
      Course_ID: doc.Course_ID,
      Year: doc.Year,
      Semester: doc.Semester,
    });
    const comp = await findOne("ASSESSMENT_COMPONENT", {
      Course_ID: doc.Course_ID,
      Component_No: doc.Component_No,
    });
    if (!enroll || !comp) {
      const err = new Error("Foreign key violation: referenced row does not exist.");
      err.code = "FK_VIOLATION";
      throw err;
    }
  } else if (table === "ALLOCATION") {
    const room = await findOne("ROOM", {
      Hostel_ID: doc.Hostel_ID,
      Room_No: doc.Room_No,
    });
    if (!room) {
      const err = new Error("Foreign key violation: referenced row does not exist.");
      err.code = "FK_VIOLATION";
      throw err;
    }
  }
}

export async function GET(_req, { params }) {
  const { name } = await params;
  const def = TABLES[name];
  if (!def) return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  try {
    const rows = await findMany(name, {}, pkSort(def), 500);
    return NextResponse.json({
      table: name,
      pk: def.pk,
      columns: def.columns,
      rows,
    });
  } catch (e) {
    return NextResponse.json(
      { error: friendlyCouchError(e), hint: "Set COUCHDB_URL in .env and run: npm run db:seed" },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  const { name } = await params;
  const def = TABLES[name];
  if (!def) return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  try {
    const body = await req.json();
    const doc = toDoc(def, body);
    await checkFKs(name, doc);
    await insertDoc(name, doc);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: friendlyCouchError(e) }, { status: 400 });
  }
}

export async function PUT(req, { params }) {
  const { name } = await params;
  const def = TABLES[name];
  if (!def) return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  try {
    const { key, row } = await req.json();
    const full = toDoc(def, row);
    const update = {};
    for (const c of def.columns) {
      if (!def.pk.includes(c.name)) update[c.name] = full[c.name];
    }
    const coercedKey = {};
    const byCol = Object.fromEntries(def.columns.map((c) => [c.name, c]));
    for (const k of def.pk) coercedKey[k] = coerce(byCol[k], key[k]);
    await checkFKs(name, { ...coercedKey, ...full });
    await updateDoc(name, coercedKey, update);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: friendlyCouchError(e) }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  const { name } = await params;
  const def = TABLES[name];
  if (!def) return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  try {
    const url = new URL(req.url);
    const byCol = Object.fromEntries(def.columns.map((c) => [c.name, c]));
    const key = {};
    for (const k of def.pk) key[k] = coerce(byCol[k], url.searchParams.get(k));
    await deleteDoc(name, key);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: friendlyCouchError(e) }, { status: 400 });
  }
}
