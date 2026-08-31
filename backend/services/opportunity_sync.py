import sqlite3
from datetime import datetime
from typing import Dict, Any, List

from database import get_db_connection
from connectors.opportunities.devto_opportunity_connector import DevToOpportunityConnector
from connectors.opportunities.github_opportunity_connector import GitHubOpportunityConnector
from connectors.opportunities.microsoft_opportunity_connector import MicrosoftOpportunityConnector
from connectors.opportunities.aws_opportunity_connector import AWSOpportunityConnector

OPPORTUNITY_CONNECTORS = {
    "DEVTO": DevToOpportunityConnector(),
    "GITHUB": GitHubOpportunityConnector(),
    "MICROSOFT": MicrosoftOpportunityConnector(),
    "AWS": AWSOpportunityConnector()
}

def classify_opportunity(title: str, description: str, skills_tags: str, dept_code_to_id: dict) -> list:
    """
    Classifies a professional opportunity/webinar into target departments:
      1. Data Engineering (DE)
      2. Cognitive Technology (COGNITIVE)
      3. DCG (DCG)
    """
    text = f"{title} {description} {skills_tags}".lower()
    matched_ids = []

    # 1. Data Engineering (DE)
    de_kw = [
        "sql", "python", "etl", "data engineering", "data analytics", "data lake", "pipeline",
        "power bi", "tableau", "azure data", "aws data", "database", "databases",
        "spark", "databricks", "snowflake", "big data", "bi"
    ]
    if any(kw in text for kw in de_kw) and "DE" in dept_code_to_id:
        matched_ids.append(dept_code_to_id["DE"])

    # 2. Cognitive Technology (COGNITIVE)
    cognitive_kw = [
        "ai", "generative ai", "genai", "machine learning", "deep learning", "nlp",
        "computer vision", "ai agents", "agentic", "mcp", "llm", "llms", "gpt",
        "responsible ai", "neural", "prompt engineering", "langchain"
    ]
    if any(kw in text for kw in cognitive_kw) and "COGNITIVE" in dept_code_to_id:
        matched_ids.append(dept_code_to_id["COGNITIVE"])

    # 3. DCG (DCG)
    dcg_kw = [
        "software development", "software engineering", "java", "python", "web development",
        "cloud", "aws", "azure", "devops", "github", "api", "apis", "system design",
        "cybersecurity", "security", "testing", "architecture", "microservices", "full stack"
    ]
    if any(kw in text for kw in dcg_kw) and "DCG" in dept_code_to_id:
        matched_ids.append(dept_code_to_id["DCG"])

    # Fallback to all departments if no specific keyword matched
    if not matched_ids:
        matched_ids = list(dept_code_to_id.values())

    return list(set(matched_ids))


def sync_opportunities(source_code: str = "ALL") -> Dict[str, Any]:
    """
    Synchronizes professional webinars, workshops & tech events from external source connectors.
    """
    from database import init_db
    init_db()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, code FROM departments WHERE isActive = 1")
    dept_code_to_id = {row["code"]: row["id"] for row in cursor.fetchall()}

    code_upper = (source_code or "ALL").upper()
    connectors_to_run = OPPORTUNITY_CONNECTORS if code_upper == "ALL" else {code_upper: OPPORTUNITY_CONNECTORS[code_upper]} if code_upper in OPPORTUNITY_CONNECTORS else {}

    if not connectors_to_run:
        conn.close()
        return {"status": "error", "message": f"Opportunity connector '{source_code}' not found."}

    now = datetime.now().isoformat()
    today_str = datetime.now().strftime("%Y-%m-%d")

    total_fetched = 0
    new_added = 0
    updated = 0
    duplicates = 0
    total_mappings = 0

    for code, connector in connectors_to_run.items():
        try:
            items = connector.fetch_opportunities(limit=25)
            total_fetched += len(items)

            for opp in items:
                src_id = opp["sourceId"]
                cursor.execute("SELECT id FROM opportunities WHERE source = ? AND sourceId = ?", (code, src_id))
                existing = cursor.fetchone()

                if existing:
                    opp_id = existing["id"]
                    cursor.execute("""
                        UPDATE opportunities SET
                            title = ?, description = ?, sourceUrl = ?, registrationUrl = ?,
                            eventType = ?, topic = ?, skills = ?, startDate = ?, endDate = ?,
                            timezone = ?, isOnline = ?, location = ?, imageUrl = ?, difficulty = ?,
                            lastSyncedAt = ?, isActive = 1, updatedAt = ?
                        WHERE id = ?
                    """, (
                        opp["title"], opp["description"], opp["sourceUrl"], opp["registrationUrl"],
                        opp["eventType"], opp["topic"], opp["skills"], opp["startDate"], opp["endDate"],
                        opp["timezone"], 1 if opp["isOnline"] else 0, opp["location"], opp["imageUrl"], opp["difficulty"],
                        now, now, opp_id
                    ))
                    updated += 1
                    duplicates += 1
                else:
                    cursor.execute("""
                        INSERT INTO opportunities (
                            title, description, source, sourceId, sourceUrl, registrationUrl,
                            eventType, topic, skills, startDate, endDate, timezone, isOnline,
                            location, imageUrl, difficulty, lastSyncedAt, isActive, createdAt, updatedAt
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
                    """, (
                        opp["title"], opp["description"], code, src_id, opp["sourceUrl"], opp["registrationUrl"],
                        opp["eventType"], opp["topic"], opp["skills"], opp["startDate"], opp["endDate"],
                        opp["timezone"], 1 if opp["isOnline"] else 0, opp["location"], opp["imageUrl"], opp["difficulty"],
                        now, now, now
                    ))
                    opp_id = cursor.lastrowid
                    new_added += 1

                # Classify & Update Department Mappings
                target_dept_ids = classify_opportunity(opp["title"], opp["description"], opp["skills"], dept_code_to_id)
                cursor.execute("DELETE FROM opportunity_departments WHERE opportunityId = ?", (opp_id,))
                for d_id in target_dept_ids:
                    cursor.execute("""
                        INSERT INTO opportunity_departments (opportunityId, departmentId, createdAt)
                        VALUES (?, ?, ?)
                    """, (opp_id, d_id, now))
                    total_mappings += 1

            # Update Source Sync Timestamp
            cursor.execute("UPDATE sources SET lastSyncAt = ?, updatedAt = ? WHERE code = ?", (now, now, code))
            conn.commit()

        except Exception as e:
            print(f"Opportunity Sync error for source '{code}': {e}")

    # Mark expired events if end date is in the past
    cursor.execute("SELECT COUNT(*) FROM opportunities WHERE endDate != '' AND endDate < ?", (today_str,))
    expired_count = cursor.fetchone()[0]

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "source": source_code,
        "syncedAt": now,
        "totalFetched": total_fetched,
        "newAdded": new_added,
        "updated": updated,
        "duplicates": duplicates,
        "expired": expired_count,
        "departmentMappingsCreated": total_mappings,
        "message": f"Successfully synchronized {total_fetched} professional opportunities & webinars."
    }
