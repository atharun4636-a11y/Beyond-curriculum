import sqlite3
from datetime import datetime
from typing import Dict, Any, List

from database import get_db_connection
from connectors.coding.leetcode_connector import LeetCodeConnector
from connectors.coding.hackerearth_coding_connector import HackerEarthCodingConnector
from connectors.coding.hackerrank_connector import HackerRankConnector

CODING_CONNECTORS = {
    "LEETCODE": LeetCodeConnector(),
    "HACKERRANK": HackerRankConnector(),
    "HACKEREARTH": HackerEarthCodingConnector()
}

def classify_departments_for_coding_problem(problem_data: dict, dept_code_to_id: dict) -> list:
    """
    Classifies a coding problem into target departments:
      - Data Engineering (DE)
      - Cognitive Technology (COGNITIVE)
      - DCG (DCG)
    """
    text = f"{problem_data.get('title', '')} {problem_data.get('category', '')} {problem_data.get('tags', '')} {problem_data.get('language', '')}".lower()
    matched_dept_ids = []

    if "sql" in text or "database" in text or "query" in text or "table" in text:
        if "DE" in dept_code_to_id: matched_dept_ids.append(dept_code_to_id["DE"])

    if "algorithm" in text or "tree" in text or "graph" in text or "matrix" in text or "ai" in text or "dp" in text:
        if "COGNITIVE" in dept_code_to_id: matched_dept_ids.append(dept_code_to_id["COGNITIVE"])

    if "python" in text or "array" in text or "string" in text or "math" in text or "code" in text:
        if "DCG" in dept_code_to_id: matched_dept_ids.append(dept_code_to_id["DCG"])

    if not matched_dept_ids:
        matched_dept_ids = list(dept_code_to_id.values())

    return list(set(matched_dept_ids))


def sync_coding_problems(source_identifier: str = "ALL") -> Dict[str, Any]:
    """
    Synchronizes coding practice problems from LeetCode, HackerRank, etc., deduplicates,
    classifies departments, and stores them in SQLite database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, code FROM departments WHERE isActive = 1")
    dept_code_to_id = {row["code"]: row["id"] for row in cursor.fetchall()}

    code_upper = (source_identifier or "ALL").upper()
    connectors_to_run = CODING_CONNECTORS if code_upper == "ALL" else {code_upper: CODING_CONNECTORS[code_upper]} if code_upper in CODING_CONNECTORS else {}

    if not connectors_to_run:
        conn.close()
        return {"status": "error", "message": f"Coding connector '{source_identifier}' not found."}

    now = datetime.now().isoformat()
    total_fetched = 0
    new_added = 0
    updated = 0
    total_mappings = 0

    for code, connector in connectors_to_run.items():
        try:
            problems = connector.fetch_problems(limit=40)
            total_fetched += len(problems)

            for prob in problems:
                src_id = prob["sourceId"]
                cursor.execute("SELECT id FROM coding_problems WHERE source = ? AND sourceId = ?", (code, src_id))
                existing = cursor.fetchone()

                if existing:
                    prob_id = existing["id"]
                    cursor.execute("""
                        UPDATE coding_problems SET
                            title = ?, url = ?, rating = ?, difficulty = ?, tags = ?,
                            skills = ?, language = ?, category = ?, lastSyncedAt = ?,
                            isActive = 1, updatedAt = ?
                        WHERE id = ?
                    """, (
                        prob["title"], prob["url"], prob.get("rating", 1200), prob["difficulty"],
                        prob.get("tags", ""), prob.get("skills", ""), prob.get("language", "Python"),
                        prob.get("category", "Algorithms"), now, now, prob_id
                    ))
                    updated += 1
                else:
                    cursor.execute("""
                        INSERT INTO coding_problems (
                            title, url, source, sourceId, rating, difficulty, tags,
                            skills, language, category, lastSyncedAt, isActive, createdAt, updatedAt
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
                    """, (
                        prob["title"], prob["url"], code, src_id, prob.get("rating", 1200),
                        prob["difficulty"], prob.get("tags", ""), prob.get("skills", ""),
                        prob.get("language", "Python"), prob.get("category", "Algorithms"),
                        now, now, now
                    ))
                    prob_id = cursor.lastrowid
                    new_added += 1

                # Save Department Mappings
                target_dept_ids = classify_departments_for_coding_problem(prob, dept_code_to_id)
                cursor.execute("DELETE FROM coding_problem_departments WHERE codingProblemId = ?", (prob_id,))
                for d_id in target_dept_ids:
                    cursor.execute("""
                        INSERT OR IGNORE INTO coding_problem_departments (codingProblemId, departmentId, createdAt)
                        VALUES (?, ?, ?)
                    """, (prob_id, d_id, now))
                    total_mappings += 1

            cursor.execute("UPDATE sources SET lastSyncAt = ?, updatedAt = ? WHERE code = ?", (now, now, code))
            conn.commit()

        except Exception as e:
            print(f"Coding Sync error for source '{code}': {e}")

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "source": source_identifier,
        "syncedAt": now,
        "totalFetched": total_fetched,
        "newAdded": new_added,
        "updated": updated,
        "departmentMappingsCreated": total_mappings,
        "message": f"Successfully synchronized {total_fetched} coding problems from LeetCode & HackerRank."
    }

def sync_leetcode():
    return sync_coding_problems("LEETCODE")

def sync_hackerrank():
    return sync_coding_problems("HACKERRANK")
