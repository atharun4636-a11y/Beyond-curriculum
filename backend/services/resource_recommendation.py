from datetime import datetime
from database import get_db_connection

def calculate_resource_relevance(resource: dict, employee: dict, active_hackathons: list) -> int:
    """
    Calculates Resource Priority Relevance Score:
    - Department match: +30
    - Employee skill match: +25
    - Hackathon skill match: +20
    - Topic match: +10
    - Technology match: +10
    - Difficulty match: +5
    - Approaching Hackathon Deadline Boost (<= 5 days): +15
    """
    score = 0
    
    # 1. Department Match (+30)
    emp_dept_id = employee.get("departmentId", 1)
    res_dept_id = resource.get("departmentId")
    res_dept_str = (resource.get("department") or "").lower()
    
    if res_dept_id == emp_dept_id or "all" in res_dept_str:
        score += 30
    elif emp_dept_id == 1 and ("data" in res_dept_str or "engineering" in res_dept_str):
        score += 30
    elif emp_dept_id == 2 and ("cognitive" in res_dept_str or "ai" in res_dept_str):
        score += 30
    elif emp_dept_id == 3 and ("dcg" in res_dept_str or "software" in res_dept_str):
        score += 30

    # 2. Employee Skills Match (+25)
    emp_skills = (employee.get("designation", "") + " " + employee.get("skills", "Python SQL Java AI ETL")).lower()
    res_skills = (resource.get("skills", "") + " " + resource.get("skill", "") + " " + resource.get("topic", "")).lower()
    
    for sk in ["python", "sql", "java", "etl", "spark", "ai", "ml", "react", "fastapi"]:
        if sk in emp_skills and sk in res_skills:
            score += 25
            break

    # 3. Hackathon Skill Match (+20) & Deadline Boost (+15)
    now = datetime.now()
    res_combined = (resource.get("title", "") + " " + resource.get("description", "") + " " + res_skills).lower()
    
    for hack in active_hackathons:
        hack_text = (hack.get("name", "") + " " + hack.get("statement", "") + " " + hack.get("skills", "")).lower()
        
        # Check skill overlap
        has_overlap = False
        for kw in ["python", "sql", "java", "ai", "ml", "react", "fastapi", "hackathon", "project"]:
            if kw in hack_text and kw in res_combined:
                has_overlap = True
                score += 20
                break
                
        if has_overlap:
            # Check approaching deadline (<= 5 days)
            event_date_str = hack.get("lastDate") or hack.get("eventDate")
            if event_date_str:
                try:
                    event_dt = datetime.fromisoformat(event_date_str.split("T")[0])
                    days_left = (event_dt - now).days
                    if 0 <= days_left <= 5:
                        score += 15
                except Exception:
                    pass

    # 4. Topic & Tech Match (+10)
    if resource.get("topic") or resource.get("technology"):
        score += 10
        
    # 5. Difficulty Match (+5)
    score += 5
    
    return min(100, max(10, score))

def get_recommended_resources_for_employee(employee_identifier: str = "252") -> list:
    """
    Fetches resources personalized for an employee, sorted by highest Relevance Score.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Fetch employee record
        cursor.execute("""
            SELECT e.*, d.name as departmentName
            FROM employees e
            LEFT JOIN departments d ON e.departmentId = d.id
            WHERE e.employeeId = ? OR CAST(e.id AS TEXT) = ? OR LOWER(e.email) = LOWER(?)
        """, (employee_identifier, employee_identifier, employee_identifier))
        emp_row = cursor.fetchone()
        
        emp = dict(emp_row) if emp_row else {
            "employeeId": employee_identifier,
            "departmentId": 1,
            "departmentName": "Data Engineering",
            "skills": "Python SQL ETL Spark"
        }
        
        # Fetch active department hackathons
        cursor.execute("SELECT * FROM hackathons WHERE isActive = 1")
        active_hacks = [dict(h) for h in cursor.fetchall()]
        
        # Fetch active resources
        cursor.execute("SELECT * FROM learning_resources WHERE isActive = 1 AND (status IS NULL OR status = 'ACTIVE' OR status = '') ORDER BY id DESC")
        resources = [dict(r) for r in cursor.fetchall()]
        
        # Compute relevance scores
        scored_resources = []
        for res in resources:
            rel_score = calculate_resource_relevance(res, emp, active_hacks)
            res["relevanceScore"] = rel_score
            res["isHighPriority"] = rel_score >= 70
            scored_resources.append(res)
            
        # Sort descending by relevanceScore
        scored_resources.sort(key=lambda x: x["relevanceScore"], reverse=True)
        return scored_resources
    finally:
        conn.close()
