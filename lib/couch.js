// CouchDB connection + helpers for ABC University.
// All 23 relations are stored as JSON documents in a single CouchDB database
// (default: "abc_university") with deterministic primary-key document IDs:
//   _id = "<TABLE>:<PK_1>[:<PK_2>...]"   (e.g. "STUDENT:1001", "ENROLLMENT:1001:401:2025:1")
//   table = "<TABLE>"
// Document fields use exact DB column names (Student_ID, Name, ...).
// Internal CouchDB fields (_id, _rev, table) are stripped from API responses
// to preserve the existing UI contract.

import { TABLES } from "./tables";

const globalForCouch = globalThis;

function normalizeCouchUrl(rawUrl) {
  // Handle passwords containing raw '@' before the host (e.g. http://admin:p@ss@127.0.0.1:5984)
  const match = rawUrl.match(/^(https?:\/\/)(.+)$/);
  if (!match) return rawUrl;
  const [, scheme, rest] = match;
  const slashIdx = rest.indexOf("/");
  const authority = slashIdx === -1 ? rest : rest.slice(0, slashIdx);
  const pathPart = slashIdx === -1 ? "" : rest.slice(slashIdx);
  const lastAt = authority.lastIndexOf("@");
  if (lastAt === -1) return rawUrl;
  const userInfo = authority.slice(0, lastAt);
  const hostPart = authority.slice(lastAt + 1);
  const colonIdx = userInfo.indexOf(":");
  if (colonIdx === -1) return rawUrl;
  const user = encodeURIComponent(decodeURIComponent(userInfo.slice(0, colonIdx)));
  const pass = encodeURIComponent(decodeURIComponent(userInfo.slice(colonIdx + 1)));
  return `${scheme}${user}:${pass}@${hostPart}${pathPart}`;
}

function getConfig() {
  const rawUrl = process.env.COUCHDB_URL;
  if (!rawUrl) {
    throw new Error(
      "COUCHDB_URL is not set. Copy .env.example to .env and set COUCHDB_URL (e.g. http://admin:password@127.0.0.1:5984)."
    );
  }
  let parsed;
  try {
    parsed = new URL(normalizeCouchUrl(rawUrl));
  } catch {
    throw new Error(`Invalid COUCHDB_URL: "${rawUrl}"`);
  }

  const user =
    process.env.COUCHDB_USER ||
    (parsed.username ? decodeURIComponent(parsed.username) : "");
  const pass =
    process.env.COUCHDB_PASSWORD ||
    (parsed.password ? decodeURIComponent(parsed.password) : "");

  const pathDb = parsed.pathname.replace(/^\/+|\/+$/g, "");
  const dbName = (process.env.COUCHDB_DB || pathDb || "abc_university").toLowerCase();

  parsed.username = "";
  parsed.password = "";
  parsed.pathname = "";
  parsed.search = "";
  parsed.hash = "";
  const baseUrl = parsed.toString().replace(/\/+$/, "");

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (user || pass) {
    headers.Authorization = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
  }

  return { baseUrl, dbName, headers };
}

export async function couchRequest(path, options = {}) {
  const { baseUrl, headers } = getConfig();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  return { status: res.status, ok: res.ok, data };
}

export async function ensureDb() {
  const { dbName } = getConfig();
  if (!globalForCouch._couchDbReadyPromise) {
    globalForCouch._couchDbReadyPromise = (async () => {
      const check = await couchRequest(`/${encodeURIComponent(dbName)}`, { method: "HEAD" });
      if (check.status === 404) {
        const create = await couchRequest(`/${encodeURIComponent(dbName)}`, { method: "PUT" });
        if (!create.ok && create.status !== 412) {
          throw new Error(
            create.data?.reason || create.data?.error || `Failed to create CouchDB database "${dbName}"`
          );
        }
      } else if (!check.ok) {
        throw new Error(
          `CouchDB connection error (HTTP ${check.status}). Check COUCHDB_URL credentials and server status.`
        );
      }
      return dbName;
    })().catch((e) => {
      globalForCouch._couchDbReadyPromise = null;
      throw e;
    });
  }
  return globalForCouch._couchDbReadyPromise;
}

// Strip CouchDB metadata (_id, _rev, table) so API returns exact DB column names.
export function cleanDoc(doc) {
  if (!doc) return doc;
  const { _id, _rev, table, ...rest } = doc;
  void _id;
  void _rev;
  void table;
  return rest;
}

// Build deterministic CouchDB _id from table name + primary-key values.
export function docId(table, keyObj) {
  const def = TABLES[table];
  if (!def) throw new Error(`Unknown table: ${table}`);
  const parts = def.pk.map((k) => {
    const v = keyObj?.[k];
    if (v === undefined || v === null || v === "") {
      throw new Error(`Missing PK: ${k}`);
    }
    return String(v);
  });
  return `${table}:${parts.join(":")}`;
}

export function pkFilter(def, keyObj) {
  const filter = {};
  for (const k of def.pk) {
    const v = keyObj[k];
    if (v === undefined || v === null || v === "") throw new Error(`Missing PK: ${k}`);
    filter[k] = v;
  }
  return filter;
}

export function pkSort(def) {
  const sort = {};
  for (const k of def.pk) sort[k] = 1;
  return sort;
}

export function sortDocs(docs, sortSpec) {
  if (!sortSpec || Object.keys(sortSpec).length === 0) return docs;
  const entries = Object.entries(sortSpec);
  return [...docs].sort((a, b) => {
    for (const [k, dir] of entries) {
      const va = a[k];
      const vb = b[k];
      if (va === vb) continue;
      if (va === null || va === undefined) return 1 * dir;
      if (vb === null || vb === undefined) return -1 * dir;
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }
      return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    }
    return 0;
  });
}

function matchesCondition(val, cond) {
  if (cond && typeof cond === "object" && !Array.isArray(cond)) {
    if ("$regex" in cond) {
      if (val === null || val === undefined) return false;
      const re = new RegExp(cond.$regex, cond.$options || "");
      return re.test(String(val));
    }
  }
  return val === cond;
}

export function matchesFilter(doc, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [k, cond] of Object.entries(filter)) {
    if (k === "$or" && Array.isArray(cond)) {
      if (!cond.some((sub) => matchesFilter(doc, sub))) return false;
      continue;
    }
    if (!matchesCondition(doc[k], cond)) return false;
  }
  return true;
}

function isExactPkLookup(def, filter) {
  if (!filter || typeof filter !== "object") return false;
  const keys = Object.keys(filter);
  if (keys.length !== def.pk.length) return false;
  for (const k of def.pk) {
    const v = filter[k];
    if (v === undefined || v === null || v === "" || typeof v === "object") return false;
  }
  return true;
}

// Fetch all documents belonging to `table` via CouchDB _all_docs key-prefix range.
export async function getTableDocs(table, { includeMeta = false } = {}) {
  if (!TABLES[table]) throw new Error(`Unknown table: ${table}`);
  const dbName = await ensureDb();
  const startkey = JSON.stringify(`${table}:`);
  const endkey = JSON.stringify(`${table}:\ufff0`);
  const path =
    `/${encodeURIComponent(dbName)}/_all_docs?include_docs=true` +
    `&startkey=${encodeURIComponent(startkey)}&endkey=${encodeURIComponent(endkey)}`;
  const res = await couchRequest(path);
  if (!res.ok) {
    throw new Error(res.data?.reason || res.data?.error || `CouchDB query failed (${res.status})`);
  }
  const rows = res.data?.rows || [];
  const docs = [];
  for (const r of rows) {
    if (!r.doc || r.id.startsWith("_design/")) continue;
    if (r.doc.table && r.doc.table !== table) continue;
    docs.push(includeMeta ? r.doc : cleanDoc(r.doc));
  }
  return docs;
}

export async function findOne(table, filter = {}) {
  const def = TABLES[table];
  if (!def) throw new Error(`Unknown table: ${table}`);
  if (isExactPkLookup(def, filter)) {
    const dbName = await ensureDb();
    const id = docId(table, filter);
    const res = await couchRequest(`/${encodeURIComponent(dbName)}/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(res.data?.reason || res.data?.error || `CouchDB get failed (${res.status})`);
    }
    return cleanDoc(res.data);
  }
  const all = await getTableDocs(table);
  return all.find((d) => matchesFilter(d, filter)) || null;
}

export async function findMany(table, filter = {}, sort = null, limit = null) {
  const all = await getTableDocs(table);
  let filtered = all.filter((d) => matchesFilter(d, filter));
  if (sort) filtered = sortDocs(filtered, sort);
  if (typeof limit === "number" && limit > 0) filtered = filtered.slice(0, limit);
  return filtered;
}

// Secondary UNIQUE constraints from the schema (non-PK unique columns).
const UNIQUE_CONSTRAINTS = {
  STUDENT: [["Email"]],
  FACULTY: [["Email"]],
  PERMANENT_FACULTY: [["PF_Number"]],
  ATTENDANCE: [["Student_ID", "Course_ID", "Att_Date"]],
};

async function checkUniqueConstraints(table, doc, excludeId = null) {
  const rules = UNIQUE_CONSTRAINTS[table];
  if (!rules) return;
  const existingDocs = await getTableDocs(table, { includeMeta: true });
  for (const cols of rules) {
    if (cols.some((c) => doc[c] === null || doc[c] === undefined || doc[c] === "")) continue;
    const dup = existingDocs.find(
      (d) => d._id !== excludeId && cols.every((c) => d[c] === doc[c])
    );
    if (dup) {
      const err = new Error("Unique constraint failed (duplicate key).");
      err.code = "DUPLICATE_KEY";
      throw err;
    }
  }
}

export async function insertDoc(table, doc) {
  const dbName = await ensureDb();
  const id = docId(table, doc);
  await checkUniqueConstraints(table, doc, null);
  const payload = { _id: id, table, ...doc };
  const res = await couchRequest(`/${encodeURIComponent(dbName)}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (res.status === 409) {
    const err = new Error("Unique constraint failed (duplicate key).");
    err.code = "DUPLICATE_KEY";
    throw err;
  }
  if (!res.ok) {
    throw new Error(res.data?.reason || res.data?.error || `CouchDB insert failed (${res.status})`);
  }
  return res.data;
}

export async function updateDoc(table, keyObj, updates) {
  const dbName = await ensureDb();
  const id = docId(table, keyObj);
  const cur = await couchRequest(`/${encodeURIComponent(dbName)}/${encodeURIComponent(id)}`);
  if (cur.status === 404) {
    const err = new Error("Row not found.");
    err.code = "NOT_FOUND";
    throw err;
  }
  if (!cur.ok) {
    throw new Error(cur.data?.reason || cur.data?.error || `CouchDB read failed (${cur.status})`);
  }
  const merged = {
    ...cur.data,
    ...updates,
    _id: cur.data._id,
    _rev: cur.data._rev,
    table,
  };
  await checkUniqueConstraints(table, merged, id);
  const res = await couchRequest(`/${encodeURIComponent(dbName)}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(merged),
  });
  if (res.status === 409) {
    const err = new Error("Document update conflict.");
    err.code = "CONFLICT";
    throw err;
  }
  if (!res.ok) {
    throw new Error(res.data?.reason || res.data?.error || `CouchDB update failed (${res.status})`);
  }
  return res.data;
}

export async function deleteDoc(table, keyObj) {
  const dbName = await ensureDb();
  const id = docId(table, keyObj);
  const cur = await couchRequest(`/${encodeURIComponent(dbName)}/${encodeURIComponent(id)}`);
  if (cur.status === 404) {
    const err = new Error("Row not found.");
    err.code = "NOT_FOUND";
    throw err;
  }
  if (!cur.ok) {
    throw new Error(cur.data?.reason || cur.data?.error || `CouchDB read failed (${cur.status})`);
  }
  const res = await couchRequest(
    `/${encodeURIComponent(dbName)}/${encodeURIComponent(id)}?rev=${encodeURIComponent(cur.data._rev)}`,
    { method: "DELETE" }
  );
  if (res.status === 404) {
    const err = new Error("Row not found.");
    err.code = "NOT_FOUND";
    throw err;
  }
  if (!res.ok) {
    throw new Error(res.data?.reason || res.data?.error || `CouchDB delete failed (${res.status})`);
  }
  return res.data;
}

// Create Mango indexes and Design Document views in CouchDB (idempotent).
export async function ensureIndexes() {
  const dbName = await ensureDb();
  const indexes = [
    { name: "idx_table", fields: ["table"] },
    { name: "idx_student_email", fields: ["table", "Email"] },
    { name: "idx_student_id", fields: ["table", "Student_ID"] },
    { name: "idx_faculty_id", fields: ["table", "Faculty_ID"] },
    { name: "idx_course_id", fields: ["table", "Course_ID"] },
  ];
  for (const idx of indexes) {
    await couchRequest(`/${encodeURIComponent(dbName)}/_index`, {
      method: "POST",
      body: JSON.stringify({
        index: { fields: idx.fields },
        name: idx.name,
        type: "json",
      }),
    });
  }

  const ddocId = "_design/university";
  const existingDdoc = await couchRequest(`/${encodeURIComponent(dbName)}/${ddocId}`);
  const ddoc = {
    _id: ddocId,
    ...(existingDdoc.ok && existingDdoc.data?._rev ? { _rev: existingDdoc.data._rev } : {}),
    language: "javascript",
    views: {
      by_table: {
        map: "function(doc) { if (doc.table) emit(doc.table, 1); }",
        reduce: "_count",
      },
      students_by_program: {
        map: "function(doc) { if (doc.table === 'STUDENT') emit(doc.Program_ID, { id: doc.Student_ID, name: doc.Name, email: doc.Email }); }",
      },
      enrollments_by_course: {
        map: "function(doc) { if (doc.table === 'ENROLLMENT') emit(doc.Course_ID, { studentId: doc.Student_ID, year: doc.Year, semester: doc.Semester, grade: doc.Grade }); }",
      },
      marks_by_course: {
        map: "function(doc) { if (doc.table === 'MARKS' && typeof doc.Marks_Obtained === 'number') emit(doc.Course_ID, doc.Marks_Obtained); }",
        reduce: "_stats",
      },
    },
  };
  await couchRequest(`/${encodeURIComponent(dbName)}/${ddocId}`, {
    method: "PUT",
    body: JSON.stringify(ddoc),
  });
}

// Translate CouchDB errors to the friendly messages the UI expects.
export function friendlyCouchError(e) {
  if (e?.code === "DUPLICATE_KEY" || e?.status === 409) {
    return "Unique constraint failed (duplicate key).";
  }
  if (e?.code === "NOT_FOUND" || e?.status === 404) {
    return "Row not found.";
  }
  if (e?.code === "FK_VIOLATION") {
    return "Foreign key violation: referenced row does not exist.";
  }
  const msg = String(e?.message || e).split("\n")[0];
  return msg;
}
