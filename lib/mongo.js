// MongoDB connection + helpers for ABC University (branch: mongodb-migration).
// One collection per former SQLite table, document keys use DB column names
// (e.g. STUDENT docs use Student_ID, Name, ...). Extra _id ObjectId is kept
// internal and stripped from API responses to preserve the existing UI contract.

import { MongoClient } from "mongodb";
import { TABLES } from "./tables";

const globalForMongo = globalThis;

function getClientPromise() {
  const liveUri = process.env.MONGODB_URI;
  if (!liveUri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env and set MONGODB_URI (MongoDB Atlas free M0)."
    );
  }
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(liveUri, {
      maxPoolSize: 5,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      retryWrites: true,
    });
    globalForMongo._mongoClientPromise = client.connect().catch((e) => {
      globalForMongo._mongoClientPromise = null;
      throw e;
    });
  }
  return globalForMongo._mongoClientPromise;
}

export async function getDb() {
  const liveDb = process.env.MONGODB_DB || "abc-university";
  const client = await getClientPromise();
  return client.db(liveDb);
}

export async function getCollection(table) {
  if (!TABLES[table]) throw new Error(`Unknown table: ${table}`);
  const db = await getDb();
  return db.collection(table);
}

// Strip internal _id so API keeps returning exact DB column names.
export function cleanDoc(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  void _id;
  return rest;
}

// Build a filter from full primary-key values (all PK cols required).
export function pkFilter(def, keyObj) {
  const filter = {};
  for (const k of def.pk) {
    const v = keyObj[k];
    if (v === undefined || v === null || v === "") throw new Error(`Missing PK: ${k}`);
    filter[k] = v;
  }
  return filter;
}

// Sort spec matching old behaviour: PK ascending, up to 500 rows.
export function pkSort(def) {
  const sort = {};
  for (const k of def.pk) sort[k] = 1;
  return sort;
}

// Create unique indexes for PKs (+ legacy UNIQUE emails). Idempotent.
export async function ensureIndexes() {
  const db = await getDb();
  for (const [table, def] of Object.entries(TABLES)) {
    const keys = {};
    for (const k of def.pk) keys[k] = 1;
    await db.collection(table).createIndex(keys, { unique: true, name: `pk_${table}` });
  }
  // Legacy UNIQUEs from SQLite schema that are not PKs:
  await db.collection("STUDENT").createIndex({ Email: 1 }, { unique: true, name: "uq_STUDENT_Email" });
  await db.collection("FACULTY").createIndex({ Email: 1 }, { unique: true, name: "uq_FACULTY_Email" });
  await db
    .collection("PERMANENT_FACULTY")
    .createIndex({ PF_Number: 1 }, { unique: true, name: "uq_PERM_PF" });
  await db
    .collection("ATTENDANCE")
    .createIndex(
      { Student_ID: 1, Course_ID: 1, Att_Date: 1 },
      { unique: true, name: "uq_ATTENDANCE_day" }
    );
}

// Translate Mongo duplicate-key errors to the friendly messages the UI expects.
export function friendlyMongoError(e) {
  const msg = String(e.message || e).split("\n")[0];
  if (e?.code === 11000) return "Unique constraint failed (duplicate key).";
  return msg;
}
