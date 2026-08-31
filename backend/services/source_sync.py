import sqlite3
import os
from datetime import datetime
from typing import Dict, Any

from database import get_db_connection
from connectors.unstop_connector import UnstopConnector
from connectors.devpost_connector import DevpostConnector
from connectors.hackerearth_connector import HackerEarthConnector
from services.eligibility_service import evaluate_employee_eligibility

# Connector Registry Map
CONNECTORS = {
    "UNSTOP": UnstopConnector(),
    "DEVPOST": DevpostConnector(),
    "HACKEREARTH": HackerEarthConnector()
}

def classify_departments_for_hackathon(hackathon_data: dict, dept_code_to_id: dict) -> list:
    """
    Analyzes title, statement, description, category, and skills to classify the hackathon
    into one or more of the 3 target departments:
      - Data Engineering (code: DE)
      - Cognitive Technology (code: COGNITIVE)
      - DCG (code: DCG)
    Returns list of department IDs.
    """
    text_content = (
        f"{hackathon_data.get('name', '')} "
        f"{hackathon_data.get('statement', '')} "
        f"{hackathon_data.get('description', '')} "
        f"{hackathon_data.get('category', '')} "
        f"{hackathon_data.get('skills', '')}"
    ).lower()

    matched_dept_ids = []

    # 1. Data Engineering Keywords
    de_keywords = [
        "data", "sql", "etl", "pipeline", "analytics", "big data", "spark",
        "hadoop", "warehouse", "database", "python", "kafka", "stream",
        "pandas", "databricks", "bi", "tableau", "powerbi"
    ]
    if any(kw in text_content for kw in de_keywords):
        if "DE" in dept_code_to_id:
            matched_dept_ids.append(dept_code_to_id["DE"])

    # 2. Cognitive Technology Keywords
    cognitive_keywords = [
        "ai", "ml", "machine learning", "deep learning", "nlp", "llm",
        "gpt", "vision", "neural", "cognitive", "genai", "agent",
        "artificial intelligence", "prompt", "forensics", "reverse engineering"
    ]
    if any(kw in text_content for kw in cognitive_keywords):
        if "COGNITIVE" in dept_code_to_id:
            matched_dept_ids.append(dept_code_to_id["COGNITIVE"])

    # 3. DCG Keywords
    dcg_keywords = [
        "cloud", "devops", "cyber", "security", "infra", "digital",
        "consulting", "governance", "blockchain", "full stack", "web",
        "app", "software", "code", "engineering", "ctf", "challenge", "coding"
    ]
    if any(kw in text_content for kw in dcg_keywords):
        if "DCG" in dept_code_to_id:
            matched_dept_ids.append(dept_code_to_id["DCG"])

    # Fallback: If no specific keyword triggered, assign to all 3 departments so hackathon is discoverable
    if not matched_dept_ids:
        matched_dept_ids = list(dept_code_to_id.values())

    return list(set(matched_dept_ids))


def cleanup_existing_student_hackathons():
    """
    Cleans existing student-only or non-employee hackathons already stored in SQLite database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, eligibility, description FROM hackathons WHERE isActive = 1")
    rows = cursor.fetchall()
    
    deactivated = 0
    for row in rows:
        h = dict(row)
        status, reason = evaluate_employee_eligibility(h)
        if status != "eligible":
            cursor.execute("""
                UPDATE hackathons SET isActive = 0, eligibilityStatus = ?, eligibilityReason = ?
                WHERE id = ?
            """, (status, reason, h["id"]))
            deactivated += 1
            print(f"[Eligibility Cleanup] Deactivated: {h['name']} | Reason: {reason}")
            
    conn.commit()
    conn.close()
    return deactivated


def sync_source(source_identifier: Any) -> Dict[str, Any]:
    """
    Synchronizes hackathons from an external source connector, applies Employee Eligibility Filtering,
    duplicate detection, department classification, and updates SQLite storage.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Resolve Source Record from DB
    if str(source_identifier).isdigit():
        cursor.execute("SELECT * FROM sources WHERE id = ?", (int(source_identifier),))
    else:
        cursor.execute("SELECT * FROM sources WHERE code = ? OR name = ?", (str(source_identifier).upper(), str(source_identifier)))
    
    source_row = cursor.fetchone()
    if not source_row:
        conn.close()
        return {
            "status": "error",
            "source": str(source_identifier),
            "message": f"Source '{source_identifier}' not found in configuration database."
        }

    source = dict(source_row)
    source_code = source["code"]

    if source_code not in CONNECTORS:
        conn.close()
        return {
            "status": "not_implemented",
            "source": source_code,
            "message": f"Connector for source '{source_code}' is not implemented yet."
        }

    connector = CONNECTORS[source_code]
    opportunities = connector.fetch_opportunities(limit=30)

    if not opportunities:
        conn.close()
        return {
            "status": "success",
            "source": source_code,
            "syncedAt": datetime.now().isoformat(),
            "totalFetched": 0,
            "eligible": 0,
            "rejected": 0,
            "uncertain": 0,
            "newAdded": 0,
            "updated": 0,
            "departmentMappingsCreated": 0,
            "message": f"No new opportunities returned from {source['name']} API."
        }

    # Fetch active departments mapping
    cursor.execute("SELECT id, code FROM departments WHERE isActive = 1")
    dept_code_to_id = {row["code"]: row["id"] for row in cursor.fetchall()}

    now = datetime.now().isoformat()
    new_added = 0
    updated = 0
    eligible_count = 0
    rejected_count = 0
    uncertain_count = 0
    total_mappings = 0

    for opp in opportunities:
        source_id = opp["sourceId"]

        # EMPLOYEE ELIGIBILITY FILTER
        elig_status, elig_reason = evaluate_employee_eligibility(opp)
        opp["eligibilityStatus"] = elig_status
        opp["eligibilityReason"] = elig_reason

        if elig_status == "eligible":
            eligible_count += 1
        elif elig_status == "not_eligible":
            rejected_count += 1
            print(f"[Eligibility] REJECTED: {opp['name']} | Reason: {elig_reason}")
        else:
            uncertain_count += 1
            print(f"[Eligibility] UNCERTAIN (Skipped): {opp['name']} | Reason: {elig_reason}")

        # Safe Default: Only import / activate if ELIGIBLE
        is_active_flag = 1 if elig_status == "eligible" else 0
        
        # Duplicate Detection using (source, sourceId)
        cursor.execute(
            "SELECT id FROM hackathons WHERE source = ? AND sourceId = ?",
            (opp["source"], source_id)
        )
        existing_hackathon = cursor.fetchone()

        if existing_hackathon:
            hackathon_id = existing_hackathon["id"]
            cursor.execute("""
                UPDATE hackathons SET
                    name = ?, statement = ?, organizer = ?, mode = ?, location = ?,
                    regLink = ?, lastDate = ?, eventDate = ?, poster = ?, description = ?,
                    sourceUrl = ?, category = ?, skills = ?, eligibility = ?, teamSize = ?,
                    eligibilityStatus = ?, eligibilityReason = ?,
                    lastSyncedAt = ?, isActive = ?, updatedAt = ?
                WHERE id = ?
            """, (
                opp["name"], opp["statement"], opp["organizer"], opp["mode"], opp["location"],
                opp["regLink"], opp["lastDate"], opp["eventDate"], opp["poster"], opp["description"],
                opp["sourceUrl"], opp["category"], opp["skills"], opp["eligibility"], opp["teamSize"],
                elig_status, elig_reason,
                now, is_active_flag, now, hackathon_id
            ))
            updated += 1
        else:
            cursor.execute("""
                INSERT INTO hackathons (
                    name, statement, organizer, mode, location, regLink, lastDate, eventDate,
                    poster, description, source, sourceId, sourceUrl, category, skills,
                    eligibility, teamSize, eligibilityStatus, eligibilityReason,
                    lastSyncedAt, isActive, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                opp["name"], opp["statement"], opp["organizer"], opp["mode"], opp["location"],
                opp["regLink"], opp["lastDate"], opp["eventDate"], opp["poster"], opp["description"],
                opp["source"], opp["sourceId"], opp["sourceUrl"], opp["category"], opp["skills"],
                opp["eligibility"], opp["teamSize"], elig_status, elig_reason,
                now, is_active_flag, now, now
            ))
            hackathon_id = cursor.lastrowid
            new_added += 1

        # Save department mappings only for active employee-eligible opportunities
        if is_active_flag == 1:
            target_dept_ids = classify_departments_for_hackathon(opp, dept_code_to_id)
            cursor.execute("DELETE FROM hackathon_departments WHERE hackathonId = ?", (hackathon_id,))
            for dept_id in target_dept_ids:
                cursor.execute("""
                    INSERT INTO hackathon_departments (hackathonId, departmentId, createdAt)
                    VALUES (?, ?, ?)
                """, (hackathon_id, dept_id, now))
                total_mappings += 1

    # Clean any legacy non-eligible stored hackathons
    cleanup_existing_student_hackathons()

    # Update Source Record lastSyncAt
    cursor.execute("UPDATE sources SET lastSyncAt = ?, updatedAt = ? WHERE id = ?", (now, now, source["id"]))
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "source": source_code,
        "syncedAt": now,
        "totalFetched": len(opportunities),
        "eligible": eligible_count,
        "rejected": rejected_count,
        "uncertain": uncertain_count,
        "newAdded": new_added,
        "updated": updated,
        "departmentMappingsCreated": total_mappings,
        "message": f"Successfully synchronized employee-eligible hackathons from {source['name']}."
    }
