"""
StaffTrack — Flask Backend  (app.py)
Run:
    pip install -r requirements.txt
    python app.py
API base: http://localhost:5000/api

Data is now stored permanently in a SQLite database file (staff.db)
that sits next to this script. Employees you add will survive
server restarts, redeploys, etc. Delete an employee and it's
actually removed from the database — it won't come back.
"""

import os
import sqlite3
from datetime import datetime
from collections import Counter

from flask import Flask, jsonify, request, g
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("STAFFTRACK_DB", os.path.join(BASE_DIR, "staff.db"))

# ── Seed data (only inserted the very first time the DB is created) ───────────

SEED_STAFF = [
    {"id": "STF001", "first_name": "Arun", "last_name": "Kumar", "email": "arun@company.com",
     "phone": "+91 98765 43210", "job_title": "Senior Engineer", "department": "Engineering",
     "status": "Active", "location": "Chennai, India", "date_joined": "2022-03-15"},
    {"id": "STF002", "first_name": "Priya", "last_name": "Sharma", "email": "priya@company.com",
     "phone": "+91 98765 43211", "job_title": "UI/UX Designer", "department": "Design",
     "status": "Active", "location": "Bangalore, India", "date_joined": "2021-07-20"},
    {"id": "STF003", "first_name": "Rahul", "last_name": "Verma", "email": "rahul@company.com",
     "phone": "+91 98765 43212", "job_title": "Marketing Manager", "department": "Marketing",
     "status": "On Leave", "location": "Mumbai, India", "date_joined": "2020-11-05"},
    {"id": "STF004", "first_name": "Meena", "last_name": "Patel", "email": "meena@company.com",
     "phone": "+91 98765 43213", "job_title": "HR Specialist", "department": "HR",
     "status": "Active", "location": "Pune, India", "date_joined": "2019-06-10"},
    {"id": "STF005", "first_name": "Kiran", "last_name": "Raj", "email": "kiran@company.com",
     "phone": "+91 98765 43214", "job_title": "Finance Analyst", "department": "Finance",
     "status": "Inactive", "location": "Hyderabad, India", "date_joined": "2023-01-22"},
    {"id": "STF006", "first_name": "Divya", "last_name": "Nair", "email": "divya@company.com",
     "phone": "+91 98765 43215", "job_title": "Sales Executive", "department": "Sales",
     "status": "Active", "location": "Delhi, India", "date_joined": "2022-08-30"},
    {"id": "STF007", "first_name": "Arjun", "last_name": "Singh", "email": "arjun@company.com",
     "phone": "+91 98765 43216", "job_title": "Backend Developer", "department": "Engineering",
     "status": "Active", "location": "Noida, India", "date_joined": "2021-03-14"},
    {"id": "STF008", "first_name": "Sneha", "last_name": "Iyer", "email": "sneha@company.com",
     "phone": "+91 98765 43217", "job_title": "Product Manager", "department": "Product",
     "status": "Active", "location": "Bangalore, India", "date_joined": "2020-09-01"},
    {"id": "STF009", "first_name": "Vikram", "last_name": "Bose", "email": "vikram@company.com",
     "phone": "+91 98765 43218", "job_title": "DevOps Engineer", "department": "Engineering",
     "status": "Active", "location": "Kolkata, India", "date_joined": "2023-04-18"},
    {"id": "STF010", "first_name": "Ananya", "last_name": "Reddy", "email": "ananya@company.com",
     "phone": "+91 98765 43219", "job_title": "Data Scientist", "department": "Analytics",
     "status": "On Leave", "location": "Chennai, India", "date_joined": "2022-12-05"},
]

USERS = {
    "admin": {"password": "admin123", "role": "Admin"},
    "staff": {"password": "staff123", "role": "Staff"},
}


# ── Database helpers ────────────────────────────────────────────────────────

def get_db():
    """One SQLite connection per request, reused via flask.g."""
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create the table if it doesn't exist yet, and seed it once."""
    db = sqlite3.connect(DB_PATH)
    db.execute("""
        CREATE TABLE IF NOT EXISTS staff (
            id           TEXT PRIMARY KEY,
            first_name   TEXT NOT NULL,
            last_name    TEXT NOT NULL,
            email        TEXT NOT NULL,
            phone        TEXT,
            job_title    TEXT NOT NULL,
            department   TEXT NOT NULL,
            status       TEXT NOT NULL DEFAULT 'Active',
            location     TEXT,
            date_joined  TEXT
        )
    """)
    # counter table so IDs keep incrementing correctly across restarts
    db.execute("""
        CREATE TABLE IF NOT EXISTS meta (
            key   TEXT PRIMARY KEY,
            value INTEGER
        )
    """)

    count = db.execute("SELECT COUNT(*) FROM staff").fetchone()[0]
    if count == 0:
        db.executemany("""
            INSERT INTO staff (id, first_name, last_name, email, phone,
                                job_title, department, status, location, date_joined)
            VALUES (:id, :first_name, :last_name, :email, :phone,
                    :job_title, :department, :status, :location, :date_joined)
        """, SEED_STAFF)

    row = db.execute("SELECT value FROM meta WHERE key = 'next_id'").fetchone()
    if row is None:
        db.execute("INSERT INTO meta (key, value) VALUES ('next_id', 11)")

    db.commit()
    db.close()


def next_id(db):
    row = db.execute("SELECT value FROM meta WHERE key = 'next_id'").fetchone()
    n = row["value"] if row else 11
    db.execute("UPDATE meta SET value = ? WHERE key = 'next_id'", (n + 1,))
    return f"STF{n:03d}"


def row_to_dict(row):
    return dict(row)


# ── Basic routes ────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return jsonify({
        "message": "StaffTrack Backend is running!",
        "status": "OK",
        "storage": "sqlite",
        "db_path": DB_PATH,
    })


# ── Auth ─────────────────────────────────────────────────────────────────────

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username", "")
    password = data.get("password", "")
    user = USERS.get(username)
    if user and user["password"] == password:
        return jsonify({"success": True, "username": username, "role": user["role"]})
    return jsonify({"success": False, "message": "Invalid credentials"}), 401


# ── Staff CRUD ───────────────────────────────────────────────────────────────

@app.route("/api/staff", methods=["GET"])
def get_staff():
    dept = request.args.get("department", "All")
    status = request.args.get("status", "All")
    query = request.args.get("q", "").lower()

    db = get_db()
    rows = db.execute("SELECT * FROM staff").fetchall()
    result = [row_to_dict(r) for r in rows]

    if dept != "All":
        result = [s for s in result if s["department"] == dept]
    if status != "All":
        result = [s for s in result if s["status"] == status]
    if query:
        result = [s for s in result if
                  query in s["first_name"].lower() or
                  query in s["last_name"].lower() or
                  query in s["email"].lower() or
                  query in s["job_title"].lower()]
    return jsonify(result)


@app.route("/api/staff/<staff_id>", methods=["GET"])
def get_one(staff_id):
    db = get_db()
    row = db.execute("SELECT * FROM staff WHERE id = ?", (staff_id,)).fetchone()
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify(row_to_dict(row))


@app.route("/api/staff", methods=["POST"])
def create_staff():
    data = request.get_json() or {}
    required = ["first_name", "last_name", "email", "job_title", "department"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    db = get_db()
    new_id = next_id(db)
    new_member = {
        "id": new_id,
        "first_name": data["first_name"],
        "last_name": data["last_name"],
        "email": data["email"],
        "phone": data.get("phone", ""),
        "job_title": data["job_title"],
        "department": data["department"],
        "status": data.get("status", "Active"),
        "location": data.get("location", ""),
        "date_joined": data.get("date_joined", datetime.today().strftime("%Y-%m-%d")),
    }
    db.execute("""
        INSERT INTO staff (id, first_name, last_name, email, phone,
                            job_title, department, status, location, date_joined)
        VALUES (:id, :first_name, :last_name, :email, :phone,
                :job_title, :department, :status, :location, :date_joined)
    """, new_member)
    db.commit()
    return jsonify(new_member), 201


@app.route("/api/staff/<staff_id>", methods=["PUT"])
def update_staff(staff_id):
    db = get_db()
    row = db.execute("SELECT * FROM staff WHERE id = ?", (staff_id,)).fetchone()
    if not row:
        return jsonify({"error": "Not found"}), 404

    member = row_to_dict(row)
    data = request.get_json() or {}
    for key in ["first_name", "last_name", "email", "phone", "job_title",
                "department", "status", "location", "date_joined"]:
        if key in data:
            member[key] = data[key]

    db.execute("""
        UPDATE staff SET first_name=:first_name, last_name=:last_name, email=:email,
               phone=:phone, job_title=:job_title, department=:department,
               status=:status, location=:location, date_joined=:date_joined
        WHERE id=:id
    """, member)
    db.commit()
    return jsonify(member)


@app.route("/api/staff/<staff_id>", methods=["DELETE"])
def delete_staff(staff_id):
    db = get_db()
    cur = db.execute("DELETE FROM staff WHERE id = ?", (staff_id,))
    db.commit()
    if cur.rowcount == 0:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"message": f"{staff_id} deleted"})


# ── Stats ────────────────────────────────────────────────────────────────────

@app.route("/api/stats", methods=["GET"])
def get_stats():
    db = get_db()
    rows = db.execute("SELECT department, status FROM staff").fetchall()
    dept_counts = Counter(r["department"] for r in rows)
    status_counts = Counter(r["status"] for r in rows)
    return jsonify({
        "total": len(rows),
        "by_department": dict(dept_counts),
        "by_status": dict(status_counts),
    })


# ── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
else:
    # also init when imported (e.g. by a WSGI server)
    init_db()

