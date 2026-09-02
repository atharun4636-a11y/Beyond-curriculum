import json
from datetime import datetime
from database import get_db_connection

def create_communication_assignment(data: dict):
    words = data.get("words", [])
    if len(words) != 10:
        raise ValueError("An assignment must contain EXACTLY 10 vocabulary words.")

    title = data.get("title", "Daily Advanced Vocabulary Challenge").strip()
    description = data.get("description", "").strip()
    assigned_date = data.get("assignedDate", datetime.now().strftime("%Y-%m-%d")).strip()
    due_date = data.get("dueDate", assigned_date + " 23:59:59").strip()
    difficulty = data.get("difficulty", "Intermediate").strip()
    department_id = data.get("departmentId")
    status = data.get("status", "PUBLISHED").strip().upper()
    now_str = datetime.now().isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO communication_assignments (
            title, description, assignedDate, dueDate, difficulty, departmentId, createdBy, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, 'admin', ?, ?, ?)
    """, (title, description, assigned_date, due_date, difficulty, department_id, status, now_str, now_str))
    
    assignment_id = cursor.lastrowid

    # Add/Attach 10 Words
    word_ids = []
    for order, w_item in enumerate(words, start=1):
        word_str = w_item["word"].strip()
        meaning = w_item["meaning"].strip()
        part_of_speech = w_item.get("partOfSpeech", "Adjective").strip()
        example = w_item.get("exampleSentence", "").strip()
        pronunciation = w_item.get("pronunciation", "").strip()
        w_diff = w_item.get("difficulty", difficulty).strip()

        cursor.execute("SELECT id FROM communication_words WHERE UPPER(word) = UPPER(?)", (word_str,))
        w_row = cursor.fetchone()
        if w_row:
            w_id = w_row[0]
            cursor.execute("""
                UPDATE communication_words
                SET meaning = ?, partOfSpeech = ?, exampleSentence = ?, pronunciation = ?, difficulty = ?
                WHERE id = ?
            """, (meaning, part_of_speech, example, pronunciation, w_diff, w_id))
        else:
            cursor.execute("""
                INSERT INTO communication_words (word, meaning, partOfSpeech, exampleSentence, pronunciation, difficulty, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (word_str, meaning, part_of_speech, example, pronunciation, w_diff, now_str))
            w_id = cursor.lastrowid

        word_ids.append(w_id)
        cursor.execute("""
            INSERT INTO assignment_words (assignmentId, wordId, displayOrder)
            VALUES (?, ?, ?)
        """, (assignment_id, w_id, order))

    conn.commit()
    conn.close()
    return get_assignment_details(assignment_id)

def get_assignment_details(assignment_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM communication_assignments WHERE id = ?", (assignment_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    assg = dict(row)
    cursor.execute("""
        SELECT w.*, aw.displayOrder
        FROM assignment_words aw
        JOIN communication_words w ON aw.wordId = w.id
        WHERE aw.assignmentId = ?
        ORDER BY aw.displayOrder ASC
    """, (assignment_id,))
    w_rows = cursor.fetchall()
    conn.close()

    assg["words"] = [dict(w) for w in w_rows]
    return assg

def get_today_assignment_for_employee(employee_id: str):
    today_str = datetime.now().strftime("%Y-%m-%d")
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM communication_assignments
        WHERE status = 'PUBLISHED' AND assignedDate <= ?
        ORDER BY id DESC LIMIT 1
    """, (today_str,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return None

    assg = dict(row)
    assg_id = assg["id"]

    # Check employee completion status
    cursor.execute("""
        SELECT status, completedAt FROM assignment_employees
        WHERE assignmentId = ? AND employeeId = ?
    """, (assg_id, employee_id))
    emp_status_row = cursor.fetchone()
    emp_status = emp_status_row["status"] if emp_status_row else "NOT_STARTED"

    # Fetch 10 Words
    cursor.execute("""
        SELECT w.*, aw.displayOrder
        FROM assignment_words aw
        JOIN communication_words w ON aw.wordId = w.id
        WHERE aw.assignmentId = ?
        ORDER BY aw.displayOrder ASC
    """, (assg_id,))
    w_rows = cursor.fetchall()

    # Fetch latest submission if exists
    cursor.execute("""
        SELECT s.*, r.overallScore, r.vocabularyScore, r.grammarScore, r.storyQualityScore, r.contextScore, r.wordsUsed, r.wordsCorrectlyUsed, r.missingWords, r.incorrectWords, r.aiFeedback
        FROM communication_submissions s
        LEFT JOIN communication_ai_results r ON s.id = r.submissionId
        WHERE s.assignmentId = ? AND s.employeeId = ?
        ORDER BY s.id DESC LIMIT 1
    """, (assg_id, employee_id))
    sub_row = cursor.fetchone()
    conn.close()

    submission_data = None
    if sub_row:
        submission_data = dict(sub_row)
        if submission_data.get("aiFeedback"):
            try:
                submission_data["aiFeedback"] = json.loads(submission_data["aiFeedback"])
            except Exception:
                pass
        if submission_data.get("missingWords"):
            try:
                submission_data["missingWords"] = json.loads(submission_data["missingWords"])
            except Exception:
                pass

    assg["employeeStatus"] = emp_status
    assg["words"] = [dict(w) for w in w_rows]
    assg["submission"] = submission_data
    return assg

def get_admin_communication_dashboard():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Total employees
    cursor.execute("SELECT COUNT(*) FROM employees WHERE role = 'employee' AND isActive = 1")
    t_row = cursor.fetchone()
    total_employees = (list(t_row.values())[0] if isinstance(t_row, dict) else t_row[0]) if t_row else 1


    # Assignments list
    cursor.execute("SELECT * FROM communication_assignments ORDER BY id DESC")
    assignments = [dict(r) for r in cursor.fetchall()]

    # Latest published assignment
    today_str = datetime.now().strftime("%Y-%m-%d")
    cursor.execute("SELECT id FROM communication_assignments WHERE status = 'PUBLISHED' ORDER BY id DESC LIMIT 1")
    latest_row = cursor.fetchone()
    latest_id = latest_row[0] if latest_row else 1

    # Submissions overview
    cursor.execute("""
        SELECT e.employeeId, e.name, e.email, e.designation, d.name AS departmentName,
               ae.status AS assignmentStatus, s.id AS submissionId, s.submittedAt,
               r.overallScore, r.wordsUsed, r.wordsCorrectlyUsed, r.wordsAssigned
        FROM employees e
        LEFT JOIN departments d ON e.departmentId = d.id
        LEFT JOIN assignment_employees ae ON ae.employeeId = e.employeeId AND ae.assignmentId = ?
        LEFT JOIN communication_submissions s ON s.employeeId = e.employeeId AND s.assignmentId = ?
        LEFT JOIN communication_ai_results r ON r.submissionId = s.id
        WHERE e.role = 'employee' AND e.isActive = 1
        ORDER BY s.id DESC
    """, (latest_id, latest_id))
    emp_rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    completed_count = sum(1 for r in emp_rows if r.get("overallScore") is not None)
    scores = [r["overallScore"] for r in emp_rows if r.get("overallScore") is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 82.0

    return {
        "totalEmployees": total_employees,
        "completedToday": completed_count,
        "pendingToday": max(0, total_employees - completed_count),
        "completionPercentage": round((completed_count / total_employees) * 100, 1) if total_employees else 0,
        "averageScore": avg_score,
        "assignments": assignments,
        "employeeOverview": emp_rows
    }
