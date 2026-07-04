"""
StaffTrack — Flask Backend  (app.py)
Run:
    pip install flask flask-cors
    python app.py
API base: http://localhost:5000/api
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ── in-memory data store (replace with a real DB in production) ───────────────

staff_db = [
    {"id":"STF001","first_name":"Arun","last_name":"Kumar","email":"arun@company.com",
     "phone":"+91 98765 43210","job_title":"Senior Engineer","department":"Engineering",
     "status":"Active","location":"Chennai, India","date_joined":"2022-03-15"},
    {"id":"STF002","first_name":"Priya","last_name":"Sharma","email":"priya@company.com",
     "phone":"+91 98765 43211","job_title":"UI/UX Designer","department":"Design",
     "status":"Active","location":"Bangalore, India","date_joined":"2021-07-20"},
    {"id":"STF003","first_name":"Rahul","last_name":"Verma","email":"rahul@company.com",
     "phone":"+91 98765 43212","job_title":"Marketing Manager","department":"Marketing",
     "status":"On Leave","location":"Mumbai, India","date_joined":"2020-11-05"},
    {"id":"STF004","first_name":"Meena","last_name":"Patel","email":"meena@company.com",
     "phone":"+91 98765 43213","job_title":"HR Specialist","department":"HR",
     "status":"Active","location":"Pune, India","date_joined":"2019-06-10"},
    {"id":"STF005","first_name":"Kiran","last_name":"Raj","email":"kiran@company.com",
     "phone":"+91 98765 43214","job_title":"Finance Analyst","department":"Finance",
     "status":"Inactive","location":"Hyderabad, India","date_joined":"2023-01-22"},
    {"id":"STF006","first_name":"Divya","last_name":"Nair","email":"divya@company.com",
     "phone":"+91 98765 43215","job_title":"Sales Executive","department":"Sales",
     "status":"Active","location":"Delhi, India","date_joined":"2022-08-30"},
    {"id":"STF007","first_name":"Arjun","last_name":"Singh","email":"arjun@company.com",
     "phone":"+91 98765 43216","job_title":"Backend Developer","department":"Engineering",
     "status":"Active","location":"Noida, India","date_joined":"2021-03-14"},
    {"id":"STF008","first_name":"Sneha","last_name":"Iyer","email":"sneha@company.com",
     "phone":"+91 98765 43217","job_title":"Product Manager","department":"Product",
     "status":"Active","location":"Bangalore, India","date_joined":"2020-09-01"},
    {"id":"STF009","first_name":"Vikram","last_name":"Bose","email":"vikram@company.com",
     "phone":"+91 98765 43218","job_title":"DevOps Engineer","department":"Engineering",
     "status":"Active","location":"Kolkata, India","date_joined":"2023-04-18"},
    {"id":"STF010","first_name":"Ananya","last_name":"Reddy","email":"ananya@company.com",
     "phone":"+91 98765 43219","job_title":"Data Scientist","department":"Analytics",
     "status":"On Leave","location":"Chennai, India","date_joined":"2022-12-05"},
]

USERS = {
    "admin": {"password": "admin123", "role": "Admin"},
    "staff": {"password": "staff123", "role": "Staff"},
}

_counter = [11]  # auto-increment for new IDs


def next_id():
    _counter[0] += 1
    return f"STF{_counter[0]:03d}"


# ── Auth ───────────────────────────────────────────────────────────────────────

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username", "")
    password = data.get("password", "")
    user = USERS.get(username)
    if user and user["password"] == password:
        return jsonify({"success": True, "username": username, "role": user["role"]})
    return jsonify({"success": False, "message": "Invalid credentials"}), 401


# ── Staff CRUD ─────────────────────────────────────────────────────────────────

@app.route("/api/staff", methods=["GET"])
def get_staff():
    dept   = request.args.get("department", "All")
    status = request.args.get("status", "All")
    query  = request.args.get("q", "").lower()

    result = staff_db[:]
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
    member = next((s for s in staff_db if s["id"] == staff_id), None)
    if not member:
        return jsonify({"error": "Not found"}), 404
    return jsonify(member)


@app.route("/api/staff", methods=["POST"])
def create_staff():
    data = request.get_json() or {}
    required = ["first_name", "last_name", "email", "job_title", "department"]
    missing  = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    new_member = {
        "id":          next_id(),
        "first_name":  data["first_name"],
        "last_name":   data["last_name"],
        "email":       data["email"],
        "phone":       data.get("phone", ""),
        "job_title":   data["job_title"],
        "department":  data["department"],
        "status":      data.get("status", "Active"),
        "location":    data.get("location", ""),
        "date_joined": data.get("date_joined", datetime.today().strftime("%Y-%m-%d")),
    }
    staff_db.append(new_member)
    return jsonify(new_member), 201


@app.route("/api/staff/<staff_id>", methods=["PUT"])
def update_staff(staff_id):
    member = next((s for s in staff_db if s["id"] == staff_id), None)
    if not member:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    for key in ["first_name","last_name","email","phone","job_title",
                "department","status","location","date_joined"]:
        if key in data:
            member[key] = data[key]
    return jsonify(member)


@app.route("/api/staff/<staff_id>", methods=["DELETE"])
def delete_staff(staff_id):
    global staff_db
    before = len(staff_db)
    staff_db = [s for s in staff_db if s["id"] != staff_id]
    if len(staff_db) == before:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"message": f"{staff_id} deleted"})


# ── Stats ──────────────────────────────────────────────────────────────────────

@app.route("/api/stats", methods=["GET"])
def get_stats():
    from collections import Counter
    dept_counts   = Counter(s["department"] for s in staff_db)
    status_counts = Counter(s["status"]     for s in staff_db)
    return jsonify({
        "total":        len(staff_db),
        "by_department": dict(dept_counts),
        "by_status":    dict(status_counts),
    })


# ── Run ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, port=5000)
