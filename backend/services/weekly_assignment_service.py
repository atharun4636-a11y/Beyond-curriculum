import sqlite3
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List
from database import get_db_connection

def get_current_week_range() -> tuple:
    """
    Returns (week_start_str, week_end_str, week_title) for current week.
    Example: ('2026-08-23', '2026-08-29', 'Week: Aug 23 – Aug 29, 2026')
    """
    now = datetime.now()
    idx = (now.weekday() + 1) % 7
    sun = now - timedelta(days=idx)
    sat = sun + timedelta(days=6)

    sun_str = sun.strftime("%Y-%m-%d")
    sat_str = sat.strftime("%Y-%m-%d")
    title = f"Week: {sun.strftime('%b %d')} – {sat.strftime('%b %d, %Y')}"
    return sun_str, sat_str, title

def generate_weekly_coding_challenge(force_recreate: bool = False) -> Dict[str, Any]:
    """
    Generates weekly coding challenge containing EXACTLY 10 problems:
      - 5 Python problems (2 Easy, 2 Medium, 1 Hard)
      - 5 SQL problems (2 Easy, 2 Medium, 1 Hard)
    From LeetCode and HackerRank.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    week_start, week_end, title = get_current_week_range()

    # Idempotency check
    cursor.execute("SELECT * FROM weekly_coding_assignments WHERE weekStart = ?", (week_start,))
    existing = cursor.fetchone()

    if existing and not force_recreate:
        challenge_id = existing["id"]
        conn.close()
        return get_weekly_challenge_details(challenge_id=challenge_id)

    if existing and force_recreate:
        cursor.execute("DELETE FROM weekly_coding_assignments WHERE id = ?", (existing["id"],))
        conn.commit()

    # Fetch candidate problems from database
    cursor.execute("SELECT * FROM coding_problems WHERE isActive = 1 AND UPPER(source) IN ('LEETCODE', 'HACKERRANK')")
    all_probs = [dict(r) for r in cursor.fetchall()]

    def pick_bucket(probs: List[dict], lang: str, diff: str, count: int) -> List[dict]:
        bucket = [p for p in probs if (p.get("language") or "Python").upper() == lang.upper() and (p.get("difficulty") or "Easy").lower() == diff.lower()]
        if len(bucket) < count:
            # Fallback to any matching language
            bucket = [p for p in probs if (p.get("language") or "Python").upper() == lang.upper()]
        return random.sample(bucket, min(count, len(bucket)))

    python_easy = pick_bucket(all_probs, "Python", "Easy", 2)
    python_med = pick_bucket(all_probs, "Python", "Medium", 2)
    python_hard = pick_bucket(all_probs, "Python", "Hard", 1)
    python_picked = python_easy + python_med + python_hard

    sql_easy = pick_bucket(all_probs, "SQL", "Easy", 2)
    sql_med = pick_bucket(all_probs, "SQL", "Medium", 2)
    sql_hard = pick_bucket(all_probs, "SQL", "Hard", 1)
    sql_picked = sql_easy + sql_med + sql_hard

    selected = python_picked + sql_picked

    # Save Challenge
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO weekly_coding_assignments (weekStart, weekEnd, title, status, createdAt, updatedAt)
        VALUES (?, ?, ?, 'Generated', ?, ?)
    """, (week_start, week_end, title, now, now))
    challenge_id = cursor.lastrowid

    # Save Challenge Problems
    for pos, p in enumerate(selected, start=1):
        cursor.execute("""
            INSERT INTO weekly_coding_problems (assignmentId, codingProblemId, position, createdAt)
            VALUES (?, ?, ?, ?)
        """, (challenge_id, p["id"], pos, now))

    # Auto assign to existing employees
    cursor.execute("SELECT employeeId FROM employees WHERE isActive = 1")
    emp_ids = [r[0] for r in cursor.fetchall()]

    due_date = week_end + " 23:59:59"
    for emp_id in emp_ids:
        for p in selected:
            cursor.execute("""
                INSERT OR IGNORE INTO employee_coding_assignments (
                    assignmentId, employeeId, codingProblemId, status, createdAt, updatedAt
                ) VALUES (?, ?, ?, 'NOT_STARTED', ?, ?)
            """, (challenge_id, emp_id, p["id"], now, now))

    conn.commit()
    conn.close()

    return get_weekly_challenge_details(challenge_id=challenge_id)

def get_weekly_challenge_details(challenge_id: int = None, employee_id: str = None) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    if challenge_id:
        cursor.execute("SELECT * FROM weekly_coding_assignments WHERE id = ?", (challenge_id,))
    else:
        week_start, _, _ = get_current_week_range()
        cursor.execute("SELECT * FROM weekly_coding_assignments WHERE weekStart = ?", (week_start,))
        if not cursor.fetchone():
            cursor.execute("SELECT * FROM weekly_coding_assignments ORDER BY weekStart DESC LIMIT 1")

    cursor.execute("SELECT * FROM weekly_coding_assignments ORDER BY weekStart DESC LIMIT 1")
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {"challenge": None, "problems": [], "progress": {"solved": 0, "total": 0, "percentage": 0}}

    challenge = dict(row)
    c_id = challenge["id"]

    cursor.execute("""
        SELECT p.*, wp.position
        FROM coding_problems p
        JOIN weekly_coding_problems wp ON p.id = wp.codingProblemId
        WHERE wp.assignmentId = ?
        ORDER BY wp.position ASC
    """, (c_id,))
    problems = [dict(r) for r in cursor.fetchall()]

    python_cnt = sum(1 for p in problems if (p.get("language") or "Python").upper() == "PYTHON")
    sql_cnt = sum(1 for p in problems if (p.get("language") or "Python").upper() == "SQL")
    easy_cnt = sum(1 for p in problems if (p.get("difficulty") or "Easy").lower() == "easy")
    med_cnt = sum(1 for p in problems if (p.get("difficulty") or "Easy").lower() == "medium")
    hard_cnt = sum(1 for p in problems if (p.get("difficulty") or "Easy").lower() == "hard")

    challenge["pythonCount"] = python_cnt
    challenge["sqlCount"] = sql_cnt
    challenge["easyCount"] = easy_cnt
    challenge["mediumCount"] = med_cnt
    challenge["hardCount"] = hard_cnt

    # If employee_id is passed, get status & submission for each problem
    verified_count = 0
    if employee_id:
        today_str = datetime.now().strftime("%Y-%m-%d")

        for p in problems:
            p_id = p["id"]
            cursor.execute("""
                SELECT * FROM employee_coding_assignments
                WHERE assignmentId = ? AND employeeId = ? AND codingProblemId = ?
            """, (c_id, employee_id, p_id))
            emp_assg_row = cursor.fetchone()

            # Check if overdue
            status = "NOT_STARTED"
            if emp_assg_row:
                status = emp_assg_row["status"]
                if status in ["NOT_STARTED", "IN_PROGRESS"] and challenge.get("weekEnd") and challenge["weekEnd"] < today_str:
                    status = "OVERDUE"

            p["status"] = status
            p["isVerified"] = (status == "VERIFIED")

            if status == "VERIFIED":
                verified_count += 1

            # Fetch submission record if exists
            cursor.execute("""
                SELECT * FROM coding_submissions
                WHERE assignmentId = ? AND employeeId = ? AND problemId = ?
                ORDER BY id DESC LIMIT 1
            """, (c_id, employee_id, p_id))
            sub_row = cursor.fetchone()
            p["submission"] = dict(sub_row) if sub_row else None

    conn.close()

    total_probs = len(problems)
    percentage = round((verified_count / max(1, total_probs)) * 100) if total_probs > 0 else 0

    return {
        "challenge": challenge,
        "problems": problems,
        "progress": {
            "solved": verified_count,
            "total": total_probs,
            "percentage": percentage
        }
    }

def assign_challenge_to_target(challenge_id: int, target_type: str = "ALL", target_id: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.* FROM coding_problems p
        JOIN weekly_coding_problems wp ON p.id = wp.codingProblemId
        WHERE wp.assignmentId = ?
    """, (challenge_id,))
    problems = [dict(r) for r in cursor.fetchall()]

    if target_type == "DEPARTMENT" and target_id:
        cursor.execute("SELECT employeeId FROM employees WHERE departmentId = ? AND isActive = 1", (int(target_id),))
    elif target_type == "EMPLOYEE" and target_id:
        cursor.execute("SELECT employeeId FROM employees WHERE (employeeId = ? OR id = ?) AND isActive = 1", (target_id, target_id))
    else:
        cursor.execute("SELECT employeeId FROM employees WHERE isActive = 1 AND role = 'employee'")

    emp_ids = [r[0] for r in cursor.fetchall()]
    now = datetime.now().isoformat()

    for emp_id in emp_ids:
        for p in problems:
            cursor.execute("""
                INSERT OR IGNORE INTO employee_coding_assignments (
                    assignmentId, employeeId, codingProblemId, status, createdAt, updatedAt
                ) VALUES (?, ?, ?, 'NOT_STARTED', ?, ?)
            """, (challenge_id, emp_id, p["id"], now, now))

    cursor.execute("UPDATE weekly_coding_assignments SET status = 'Assigned', updatedAt = ? WHERE id = ?", (now, challenge_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": f"Challenge {challenge_id} assigned to {len(emp_ids)} employees."}

def get_admin_employee_coding_progress():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get latest challenge ID
    cursor.execute("SELECT id, weekStart, weekEnd FROM weekly_coding_assignments ORDER BY id DESC LIMIT 1")
    c_row = cursor.fetchone()
    if not c_row:
        conn.close()
        return {"employees": [], "summary": {}}

    c_id = c_row["id"]
    today_str = datetime.now().strftime("%Y-%m-%d")
    is_overdue_week = (c_row["weekEnd"] < today_str)

    cursor.execute("""
        SELECT e.employeeId, e.name, e.email, e.designation, d.name AS departmentName
        FROM employees e
        LEFT JOIN departments d ON e.departmentId = d.id
        WHERE e.role = 'employee' AND e.isActive = 1
    """)
    employees = [dict(r) for r in cursor.fetchall()]

    emp_progress_list = []
    total_assigned_sum = 0
    total_verified_sum = 0
    completed_emps = 0
    in_progress_emps = 0
    not_started_emps = 0
    overdue_emps = 0

    for emp in employees:
        emp_id = emp["employeeId"]

        # Fetch employee problem statuses for current challenge
        cursor.execute("""
            SELECT eca.status, p.language, p.difficulty, eca.codingProblemId
            FROM employee_coding_assignments eca
            JOIN coding_problems p ON eca.codingProblemId = p.id
            WHERE eca.assignmentId = ? AND eca.employeeId = ?
        """, (c_id, emp_id))
        rows = [dict(r) for r in cursor.fetchall()]

        total_probs = len(rows) if rows else 10
        python_verified = sum(1 for r in rows if r["status"] == "VERIFIED" and (r.get("language") or "Python").upper() == "PYTHON")
        python_total = sum(1 for r in rows if (r.get("language") or "Python").upper() == "PYTHON") or 5
        sql_verified = sum(1 for r in rows if r["status"] == "VERIFIED" and (r.get("language") or "Python").upper() == "SQL")
        sql_total = sum(1 for r in rows if (r.get("language") or "Python").upper() == "SQL") or 5

        total_verified = python_verified + sql_verified
        progress_pct = round((total_verified / max(1, total_probs)) * 100)

        # Status logic
        if total_verified == total_probs and total_probs > 0:
            emp_status = "COMPLETED"
            completed_emps += 1
        elif is_overdue_week and total_verified < total_probs:
            emp_status = "OVERDUE"
            overdue_emps += 1
        elif any(r["status"] in ["IN_PROGRESS", "SUBMITTED"] for r in rows):
            emp_status = "IN_PROGRESS"
            in_progress_emps += 1
        elif total_verified < (total_probs // 2) and is_overdue_week:
            emp_status = "AT_RISK"
            overdue_emps += 1
        else:
            emp_status = "NOT_STARTED"
            not_started_emps += 1

        total_assigned_sum += total_probs
        total_verified_sum += total_verified

        emp_progress_list.append({
            "employeeId": emp_id,
            "name": emp["name"],
            "departmentName": emp["departmentName"] or "Data Engineering",
            "designation": emp["designation"] or "Software Engineer",
            "pythonProgress": f"{python_verified}/{python_total}",
            "sqlProgress": f"{sql_verified}/{sql_total}",
            "totalProgress": f"{total_verified}/{total_probs}",
            "progressPercentage": progress_pct,
            "status": emp_status
        })

    conn.close()

    total_emps_cnt = len(employees)
    overall_completion_pct = round((total_verified_sum / max(1, total_assigned_sum)) * 100) if total_assigned_sum else 0

    return {
        "employees": emp_progress_list,
        "summary": {
            "totalEmployees": total_emps_cnt,
            "completed": completed_emps,
            "inProgress": in_progress_emps,
            "notStarted": not_started_emps,
            "overdue": overdue_emps,
            "completionRate": overall_completion_pct
        }
    }

# Legacy Function Aliases
generate_weekly_assignment = generate_weekly_coding_challenge
get_current_weekly_assignment_details = get_weekly_challenge_details
get_all_employees_weekly_progress = get_admin_employee_coding_progress

