import { NextResponse } from "next/server";
import { TABLES, FK_REFS } from "../../../../lib/tables";
import { getCollection, pkFilter, pkSort, cleanDoc, friendlyMongoError } from "../../../../lib/mongo";

// Generic CRUD over MongoDB collections. Documents use DB column names
// (School_ID, Name, ...) so the UI contract is unchanged from SQLite.

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

// Minimal FK check to keep the friendly "Foreign key violation" UX from SQLite.
// Skips null/empty FK values (nullable FKs) and composite-FK member columns.
async function checkFKs(table, doc) {
  const refs = FK_REFS[table] || {};
  for (const [col, refTable] of Object.entries(refs)) {
    const v = doc[col];
    if (v === null || v === undefined || v === "") continue;
    const refDef = TABLES[refTable];
    // Only enforce single-column FKs where col maps to the parent PK directly.
    // Composite parents (ROOM, ENROLLMENT, ...) are validated by PK uniqueness instead.
    if (refDef.pk.length === 1 && refDef.pk[0] === col.replace(/^(Student|Faculty|Course|School|Dept|Program|Scholarship|Hostel|Project)_.*/, "") === false) {
      // fallthrough to generic check below
    }
    const refCol = await getCollection(refTable);
    // Match by the referenced table's PK when names align, else by any column of same value:
    // we look up parent where its PK column equals v IF that PK is the FK target.
    // Simplest robust rule: parent has a row whose PK (single) equals v, or any row
    // where the corresponding key column equals v.
    const parentDef = TABLES[refTable];
    let exists = null;
    if (parentDef.pk.length === 1) {
      // e.g. STUDENT.Program_ID -> PROGRAM.Program_ID
      // FK column name differs from parent PK name, so try parent PK = v.
      exists = await refCol.findOne({ [parentDef.pk[0]]: v });
    } else {
      // Composite parent: check the shared column (e.g. ALLOCATION.Hostel_ID -> ROOM exists with that Hostel_ID)
      const shared = parentDef.pk.find((k) => k === col) || parentDef.pk[0];
      exists = await refCol.findOne({ [shared]: v });
    }
    if (!exists) {
      const err = new Error(`Foreign key violation: ${table}.${col}=${v} has no ${refTable} parent.`);
      err.code = "FK_VIOLATION";
      throw err;
    }
  }
}

function friendlyError(e) {
  if (e?.code === "FK_VIOLATION") return "Foreign key violation: referenced row does not exist.";
  return friendlyMongoError(e);
}

export async function GET(_req, { params }) {
  const { name } = await params;
  const def = TABLES[name];
  if (!def) return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  try {
    const col = await getCollection(name);
    const docs = await col.find({}).sort(pkSort(def)).limit(500).toArray();
    return NextResponse.json({
      table: name,
      pk: def.pk,
      columns: def.columns,
      rows: docs.map(cleanDoc),
    });
  } catch (e) {
    return NextResponse.json(
      { error: friendlyError(e), hint: "Set MONGODB_URI in .env and run: npm run db:seed:mongo" },
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
    const col = await getCollection(name);
    await col.insertOne(doc);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: friendlyError(e) }, { status: 400 });
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
    await checkFKs(name, { ...toDoc(def, key), ...full });
    const col = await getCollection(name);
    const res = await col.updateOne(pkFilter(def, toDoc(def, key)), { $set: update });
    if (res.matchedCount === 0) return NextResponse.json({ error: "Row not found." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: friendlyError(e) }, { status: 400 });
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
    const col = await getCollection(name);
    const res = await col.deleteOne(pkFilter(def, key));
    if (res.deletedCount === 0) return NextResponse.json({ error: "Row not found." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: friendlyError(e) }, { status: 400 });
  }
}
