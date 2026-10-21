# 🎓 ABC University - DBMS Project Viva & Presentation Guide

> **Project Name**: ABC University - Integrated Academic Management System  
> **Tech Stack**: Next.js 15 (App Router), React 19, Apache CouchDB, Node.js  
> **Scope**: 23 Relations, Full CRUD, Referential Integrity, Computed Analytics, Scoped Global Search  

---

## ⚡ 30-Second Elevator Pitch (Memorize This!)

> *"Our project is the **ABC University Integrated Academic Management System**. It models and manages the complete academic lifecycle—schools, departments, degree programs, faculty specializations, student enrollment, daily attendance, assessment marks, hostel accommodations, scholarships, and research projects across **23 database relations**.*  
>  
> *The database layer is powered by **Apache CouchDB** using deterministic composite primary keys, B-tree range queries, and MapReduce views, with an application-level referential integrity middleware. The frontend is built with **Next.js 15 App Router and React 19**, offering generic dynamic CRUD, foreign-key dropdown lookups, and real-time aggregated 360° student and faculty profiles."*

---

## 👥 Team Roles & What to Study Tonight

### 1. Harshit (Frontend Specialist)
**Your core responsibility**: UI/UX, page structure, client-server data flow, form validation, and foreign-key UX.

* **Tech Stack**: Next.js 15 App Router, React 19, Vanilla CSS (`app/globals.css`).
* **Key Concepts to Explain**:
  * **Dynamic CRUD Screen (`/tables/[name]`)**: A single reusable page that dynamically renders forms and tables for *any* of the 23 relations by reading schema metadata from `lib/tables.js`.
  * **Foreign Key Dropdowns**: Instead of allowing users to type raw IDs (which causes foreign key errors), the frontend queries `/api/options?table=<target>` and dynamically populates `<select>` dropdowns with valid existing parent records.
  * **Client vs Server Components**:
    * Table CRUD page is a **Client Component** (`"use client"`) because it manages form input state, inline editing states, and client-side `fetch()` calls.
    * Student and Faculty detail pages are **Server Components** that query the data layer directly on the server before streaming HTML to the client for optimal performance.
  * **User Experience & Error Handling**: Translates HTTP 400/409 errors from the backend into user-friendly alerts (e.g., *"Unique constraint failed"* or *"Foreign key violation"*).

---

### 2. Vanshika (Database Architect - ER Modeling & Normalization)
**Your core responsibility**: Conceptual design, ER diagrams, 23 relations categorization, and Normalization defense.

* **5 Logical Relation Groups (23 Total Tables)**:
  1. *Academic Structure*: `SCHOOL`, `DEPARTMENT`, `PROGRAM`, `COURSE`
  2. *People & Specialization*: `FACULTY`, `STUDENT`, `STUDENT_PHONE`, `FACULTY_QUALIFICATION`, `PERMANENT_FACULTY`, `ADJUNCT_FACULTY`, `VISITING_FACULTY`
  3. *Teaching & Assessment*: `ASSESSMENT_COMPONENT`, `ENROLLMENT`, `ATTENDANCE`, `MARKS`, `TEACHES`
  4. *Accommodation & Support*: `HOSTEL`, `ROOM`, `ALLOCATION`, `SCHOLARSHIP`, `AWARDED`
  5. *Research*: `PROJECT`, `UNDERTAKES`
* **Generalization / Specialization (ISA Hierarchy)**:
  * `FACULTY` is the super-entity containing common fields (Name, Email, Phone, Dept).
  * `PERMANENT_FACULTY` (Salary, PF Number), `ADJUNCT_FACULTY` (Hourly Rate), and `VISITING_FACULTY` (Home Institution) are specialized sub-entities sharing `Faculty_ID` as both Primary Key and Foreign Key.
* **Normalization Proofs (Crucial Viva Defense)**:
  * **1NF (Atomic Values)**: Multi-valued phone numbers and qualifications were eliminated by creating separate weak relations: `STUDENT_PHONE(Student_ID, Phone)` and `FACULTY_QUALIFICATION(Faculty_ID, Qualification)` with composite primary keys.
  * **2NF (No Partial Dependency)**: In composite key tables like `ENROLLMENT(Student_ID, Course_ID, Year, Semester)`, attributes depend on the entire composite key, not just a subset. Student names or course titles are never duplicated here.
  * **3NF (No Transitive Dependency)**: A student belongs to a `PROGRAM`, which belongs to a `DEPARTMENT`, which belongs to a `SCHOOL`. The `STUDENT` table stores *only* `Program_ID`, preventing transitive anomalies ($Student \rightarrow Program \rightarrow Dept$).

---

### 3. Yashika (Database Engineer - CouchDB Engine & Constraints)
**Your core responsibility**: Physical storage, CouchDB mechanics, keys, constraints, and referential integrity.

* **Keys & Cardinalities**:
  * **Single Primary Keys**: `Student_ID`, `Faculty_ID`, `Course_ID`, `Hostel_ID`, `Project_ID`.
  * **Composite Primary Keys**:
    * `ENROLLMENT`: `(Student_ID, Course_ID, Year, Semester)` (Handles re-enrollment across semesters).
    * `MARKS`: `(Student_ID, Course_ID, Year, Semester, Component_No)`.
    * `ROOM`: `(Hostel_ID, Room_No)`.
    * `ALLOCATION`: `(Student_ID, Hostel_ID, Room_No, Alloc_Date)`.
  * **Unique Constraints (Candidate Keys)**: Student `Email`, Faculty `Email`, and `PF_Number` have strict uniqueness enforced.
* **Business & Domain Constraints**:
  * `Program.Level`: Must be `'UG'`, `'PG'`, or `'Doctoral'`.
  * `Assessment_Component.Weightage`: Between $1$ and $100\%$.
  * `Attendance.Status`: Restricted to `'Present'` or `'Absent'`.
  * Chronological constraints: `Vacate_Date >= Alloc_Date` and `End_Date >= Start_Date`.
* **Referential Integrity & Delete Cascades**:
  * **ON DELETE CASCADE**: Deleting a `COURSE` deletes its assessment components; deleting a `HOSTEL` deletes all its rooms.
  * **ON DELETE SET NULL**: Deleting a supervisor faculty sets `PROJECT.Faculty_ID` to `NULL` so research projects are not erased.
  * **Restricted Delete**: Parent records cannot be deleted if child records depend on them (e.g., cannot delete a `DEPARTMENT` that still owns `COURSE`s).

---

## 🧠 Core CouchDB Concepts Used in this Project

If the examiner asks: *"How does CouchDB work in your project?"*, answer with these 6 points:

| CouchDB Concept | How It Is Used in ABC University |
| :--- | :--- |
| **1. Document Store** | Records are stored as JSON documents inside the `abc_university` database. Each document has a `table` attribute tagging its relation (e.g. `"table": "STUDENT"`). |
| **2. Deterministic `_id` Keys** | Instead of random hashes, document IDs follow the rule: `_id = "<TABLE>:<PK1>[:<PK2>...]"` (e.g. `STUDENT:1001` or `ENROLLMENT:1001:401:2025:1`). This gives $O(1)$ direct primary key lookups and prevents duplicate keys natively via CouchDB's unique `_id` constraint. |
| **3. MVCC & `_rev`** | Multi-Version Concurrency Control. CouchDB attaches a revision token `_rev` to every document. Updates and deletes pass `_rev`. If concurrent edits occur, CouchDB returns `HTTP 409 Conflict`, preventing lost updates. |
| **4. Range Queries (`_all_docs`)** | CouchDB stores document keys in an alphabetical B-Tree. Fetching all records for a single relation uses: `_all_docs?startkey="STUDENT:"&endkey="STUDENT:\ufff0"` to instantly slice only that table's rows. |
| **5. MapReduce Design Views** | A design document `_design/university` contains pre-computed MapReduce views: `by_table` (uses `_count` reducer) and `marks_by_course` (uses `_stats` reducer to compute course min/max/average marks). |
| **6. Integrity Middleware** | Because CouchDB is schema-less NoSQL, `lib/couch.js` validates Foreign Key references and secondary Unique Constraints *before* writing documents to CouchDB, replicating strict SQL database guarantees. |

---

## 📂 File Reading Assignments

Open these files in VS Code tonight to understand your code:

### For Harshit (Frontend):
1. [`app/page.js`](file:///c:/Users/harsh/Desktop/DBMS_PROJECT/app/page.js) - Home dashboard displaying the 23-table grid and search box.
2. [`app/tables/[name]/page.js`](file:///c:/Users/harsh/Desktop/DBMS_PROJECT/app/tables/[name]/page.js) - Generic CRUD UI, table state, and dynamic foreign-key `<select>` dropdowns.
3. [`app/students/[id]/page.js`](file:///c:/Users/harsh/Desktop/DBMS_PROJECT/app/students/[id]/page.js) - 360° Student profile aggregating marks, mentor, and attendance.
4. [`components/SearchBox.js`](file:///c:/Users/harsh/Desktop/DBMS_PROJECT/components/SearchBox.js) - Instant scoped search input component.

### For Vanshika (Database Design & ER):
1. [`README.md`](file:///c:/Users/harsh/Desktop/DBMS_PROJECT/README.md) *(Lines 125–270)* - ER diagrams, complete 23-table dictionary, and integrity rules.
2. [`lib/tables.js`](file:///c:/Users/harsh/Desktop/DBMS_PROJECT/lib/tables.js) - Central definition of all 23 relations, primary keys, column types, and foreign key references (`FK_REFS`).

### For Yashika (CouchDB Engine & Data Layer):
1. [`lib/couch.js`](file:///c:/Users/harsh/Desktop/DBMS_PROJECT/lib/couch.js) - Deterministic IDs (`docId`), B-Tree queries (`getTableDocs`), CRUD methods (`insertDoc`, `updateDoc`, `deleteDoc`), and MapReduce views (`ensureIndexes`).
2. [`scripts/couch-seed.js`](file:///c:/Users/harsh/Desktop/DBMS_PROJECT/scripts/couch-seed.js) - Bulk document seeding (`_bulk_docs`) and initial sample dataset.
3. [`lib/lookup.js`](file:///c:/Users/harsh/Desktop/DBMS_PROJECT/lib/lookup.js) - Computed aggregations (GPA calculation, attendance percentage, and course analytics).

---

## 🎯 Top 10 High-Yield Viva Questions & Answers

#### Q1: "Why did you choose a 23-table normalized schema instead of 2-3 big tables?"
> **Answer**: *"To eliminate data redundancy, update anomalies, insertion anomalies, and deletion anomalies. By decomposing the domain into 23 normalized tables up to 3NF, every fact is stored in exactly one canonical location."*

#### Q2: "What is a Composite Primary Key? Give examples from your project."
> **Answer**: *"A composite primary key is a combination of two or more columns that uniquely identify a record. For example: `ENROLLMENT` uses `(Student_ID, Course_ID, Year, Semester)` because a student can enroll in multiple courses across different terms; and `STUDENT_PHONE` uses `(Student_ID, Phone)` to handle multiple contact numbers per student."*

#### Q3: "What is the relationship between FACULTY and COURSE?"
> **Answer**: *"It is a Many-to-Many ($M:N$) relationship. A faculty member can teach multiple courses over time, and a course can be instructed by different professors across semesters. This is mediated by the junction relation `TEACHES(Course_ID, Year, Semester, Faculty_ID)`."*

#### Q4: "How do you handle multi-valued attributes in relational design?"
> **Answer**: *"First Normal Form (1NF) forbids non-atomic, multi-valued attributes. Instead of storing multiple phone numbers or degrees as comma-separated text, we extracted them into dedicated relations: `STUDENT_PHONE` and `FACULTY_QUALIFICATION` with composite keys."*

#### Q5: "Is CouchDB NoSQL or Relational? How is it used here?"
> **Answer**: *"CouchDB is a document-oriented NoSQL database. However, our architecture enforces a rigorous **3NF relational schema** on top of it. We use deterministic composite document IDs (`_id = TABLE:PK1:PK2`) and an application-level referential integrity middleware to maintain relational consistency."*

#### Q6: "What happens if you delete a parent record that has children?"
> **Answer**: *"By default, referential integrity restricts the deletion and throws an error if child rows exist. We have two explicit exceptions: `COURSE` and `HOSTEL` use `ON DELETE CASCADE` (deleting a course removes its assessment components), and `PROJECT.Faculty_ID` uses `ON DELETE SET NULL` so research records are retained if a supervisor leaves."*

#### Q7: "How does the frontend prevent Foreign Key violation errors?"
> **Answer**: *"In our generic table view (`app/tables/[name]/page.js`), the UI checks `FK_REFS` in `lib/tables.js`. When a field is a foreign key, the UI queries `/api/options?table=<target>` and displays an HTML `<select>` dropdown containing valid existing parent keys and names, preventing users from submitting invalid foreign keys."*

#### Q8: "Why aren't Student Average Marks or Attendance Percentage stored as table columns?"
> **Answer**: *"Storing calculated metrics directly in tables violates 3NF (transitive/derived dependency) and causes update anomalies. In our system, `lib/lookup.js` computes average marks and attendance percentages dynamically from raw records in `MARKS` and `ATTENDANCE`."*

#### Q9: "What is MVCC in CouchDB?"
> **Answer**: *"MVCC stands for Multi-Version Concurrency Control. CouchDB tracks revisions via a `_rev` string. When updating or deleting documents, the client must supply the current `_rev`. If a conflicting write occurred, CouchDB responds with an HTTP 409 Conflict, ensuring data consistency without table-level locking."*

#### Q10: "How do you fetch all records of a single table in CouchDB without scanning everything?"
> **Answer**: *"Because our document IDs start with the table name (e.g. `STUDENT:1001`), and CouchDB indexes IDs alphabetically in a B-Tree, we perform an efficient range query using `_all_docs` with `startkey="STUDENT:"` and `endkey="STUDENT:\ufff0"`."*

---

## 🎬 3-Minute Live Demo Script (Rehearse This Flow!)

| Time | Speaker | Action on Screen | Spoken Script |
| :---: | :--- | :--- | :--- |
| **0:00 - 0:45** | **Harshit** | Open `http://localhost:3000`. Show the 23-table grid. Type `"Aarav"` into search. | *"This is our ABC University Academic Management System. The home dashboard renders all 23 database relations with their primary keys. Our global search allows instant lookups across students, faculty, and courses."* |
| **0:45 - 1:30** | **Harshit** | Click on student **Aarav** (`/students/1001`). | *"Here is our 360° detail view. The server aggregates data across multiple relations in real time: student program, mentor faculty, GPA/average marks, attendance percentage, enrolled courses, and hostel room allocation."* |
| **1:30 - 2:15** | **Yashika** | Navigate to `/tables/STUDENT` or `/tables/ENROLLMENT`. Click an empty form field. | *"In our CRUD view, notice that foreign-key columns like `Program_ID` automatically render as dropdowns populated from the parent table. Furthermore, if we attempt to submit a duplicate primary key or invalid data, our integrity middleware immediately displays a clear constraint error."* |
| **2:15 - 3:00** | **Vanshika** | Show the ER Diagram or Table Reference in `README.md`. | *"Our relational schema strictly satisfies 1NF, 2NF, and 3NF. Multi-valued attributes like phone numbers and qualifications are modeled in separate relations, and faculty employment types are designed using Generalization and Specialization."* |

---

## 🛠️ Emergency Commands & Pre-Presentation Setup

Run these commands in PowerShell inside `c:\Users\harsh\Desktop\DBMS_PROJECT` before the presentation:

1. **Start the Next.js app**:
   ```powershell
   npm run dev
   ```
2. **If database is empty or needs fresh data**:
   ```powershell
   npm run db:seed
   ```
3. **If you need a complete clean reset and reseed**:
   ```powershell
   npm run db:reset
   ```
4. **Open in browser**:
   - Web App: `http://localhost:3000`
   - CouchDB Dashboard (Fauxton): `http://127.0.0.1:5984/_utils`

Good luck! You have a complete, robust project. Follow your assigned roles and you will ace the presentation! 🚀
