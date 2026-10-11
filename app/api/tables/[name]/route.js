import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { TABLES } from "../../../../lib/tables";

// Helpers: DB names (SCHOOL, School_ID) <-> Prisma names (school, schoolId)
function camel(name) {
  const parts = name.toLowerCase().split("_");
  return parts.map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1))).join("");
}

function toDelegate(table) {
  return camel(table);
}

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

function toPrismaData(def, obj) {
  const data = {};
  for (const c of def.columns) data[camel(c.name)] = coerce(c, obj[c.name]);
  return data;
}

function toDbRow(def, record) {
  const row = {};
  for (const c of def.columns) row[c.name] = record[camel(c.name)];
  return row;
}

// Prisma compound-where key for @@id / single @id, e.g. { studentId_courseId_year_semester: {...} }
function whereFor(def, keyObj) {
  const byCol = Object.fromEntries(def.columns.map((c) => [c.name, c]));
  if (def.pk.length === 1) {
    const c = byCol[def.pk[0]];
    return { [camel(c.name)]: coerce(c, keyObj[c.name]) };
  }
  const name = def.pk.map((k) => camel(k)).join("_");
  const inner = {};
  for (const k of def.pk) inner[camel(k)] = coerce(byCol[k], keyObj[k]);
  return { [name]: inner };
}

function friendlyError(e) {
  const msg = String(e.message || e).split("\n")[0];
  if (e.code === "P2002") return "Unique constraint failed (duplicate key).";
  if (e.code === "P2003") return "Foreign key violation: referenced row does not exist.";
  if (e.code === "P2025") return "Row not found.";
  return msg;
}

export async function GET(_req, { params }) {
  const { name } = await params;
  const def = TABLES[name];
  if (!def) return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  try {
    const orderBy = def.pk.map((k) => ({ [camel(k)]: "asc" }));
    const records = await prisma[toDelegate(name)].findMany({ orderBy, take: 500 });
    return NextResponse.json({
      table: name,
      pk: def.pk,
      columns: def.columns,
      rows: records.map((r) => toDbRow(def, r)),
    });
  } catch (e) {
    return NextResponse.json(
      { error: friendlyError(e), hint: "Run: npm run db:init" },
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
    await prisma[toDelegate(name)].create({ data: toPrismaData(def, body) });
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
    const full = toPrismaData(def, row);
    const data = {};
    for (const c of def.columns) {
      if (!def.pk.includes(c.name)) data[camel(c.name)] = full[camel(c.name)];
    }
    const res = await prisma[toDelegate(name)].update({ where: whereFor(def, key), data });
    void res;
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
    const key = {};
    for (const k of def.pk) key[k] = url.searchParams.get(k);
    const res = await prisma[toDelegate(name)].delete({ where: whereFor(def, key) });
    void res;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: friendlyError(e) }, { status: 400 });
  }
}
