import sqlite3
import os
import urllib.request
import urllib.parse
from datetime import datetime
from typing import Dict, Any

from database import get_db_connection
from connectors.resources.github_resource_connector import GitHubResourceConnector
from connectors.resources.devto_resource_connector import DevToResourceConnector

RESOURCE_CONNECTORS = {
    "GITHUB": GitHubResourceConnector(),
    "DEVTO": DevToResourceConnector()
}

# Trusted Documentation & Learning Source Catalog
TRUSTED_RESOURCE_CATALOG = [
    # Data Engineering (Dept 1)
    {"topic": "SQL", "title": "W3Schools Interactive SQL Tutorial & Exercises", "url": "https://www.w3schools.com/sql/", "source": "W3Schools", "resourceType": "Tutorial", "difficulty": "Beginner", "deptId": 1},
    {"topic": "SQL", "title": "GeeksforGeeks Advanced SQL & PL/SQL Masterclass", "url": "https://www.geeksforgeeks.org/sql-tutorial/", "source": "GeeksforGeeks", "resourceType": "Practice", "difficulty": "Medium", "deptId": 1},
    {"topic": "PySpark", "title": "Apache Spark & PySpark Official Documentation & Guide", "url": "https://spark.apache.org/docs/latest/api/python/", "source": "Official Documentation", "resourceType": "Documentation", "difficulty": "Advanced", "deptId": 1},
    {"topic": "Python", "title": "Official Python 3.12 Reference Documentation", "url": "https://docs.python.org/3/", "source": "Official Documentation", "resourceType": "Documentation", "difficulty": "Beginner", "deptId": 1},
    {"topic": "Databricks", "title": "Databricks Lakehouse Platform & Delta Lake Guide", "url": "https://docs.databricks.com/", "source": "Databricks", "resourceType": "Documentation", "difficulty": "Advanced", "deptId": 1},
    {"topic": "Real-time Practice", "title": "LeetCode Top 50 SQL Study Plan & Practice Challenges", "url": "https://leetcode.com/studyplan/sql-50/", "source": "LeetCode", "resourceType": "Practice", "difficulty": "Medium", "deptId": 1},
    {"topic": "Real-time Practice", "title": "HackerRank SQL Domain Practice & SQL Badges", "url": "https://www.hackerrank.com/domains/sql", "source": "HackerRank", "resourceType": "Practice", "difficulty": "Easy", "deptId": 1},
    {"topic": "AWS", "title": "AWS Certified Data Engineer & S3/Glue Analytics Guide", "url": "https://aws.amazon.com/training/", "source": "AWS", "resourceType": "Documentation", "difficulty": "Advanced", "deptId": 1},
    {"topic": "PowerBI", "title": "Microsoft Learn Power BI Data Analyst Certification Guide", "url": "https://learn.microsoft.com/en-us/power-bi/", "source": "Microsoft Learn", "resourceType": "Documentation", "difficulty": "Medium", "deptId": 1},
    {"topic": "Mini Hands-on Tasks", "title": "Hands-on Beginner Data Engineering End-to-End Pipeline Project", "url": "https://github.com/josephmachado/beginner_de_project", "source": "GitHub", "resourceType": "Project Guide", "difficulty": "Beginner", "deptId": 1},

    # Cognitive Technology (Dept 2)
    {"topic": "SQL", "title": "W3Schools Interactive SQL Reference & Practice", "url": "https://www.w3schools.com/sql/", "source": "W3Schools", "resourceType": "Tutorial", "difficulty": "Beginner", "deptId": 2},
    {"topic": "Python", "title": "Official Python 3.12 Documentation & AI Libraries Reference", "url": "https://docs.python.org/3/", "source": "Official Documentation", "resourceType": "Documentation", "difficulty": "Beginner", "deptId": 2},
    {"topic": "FastAPI", "title": "FastAPI Official Production Architecture Guide", "url": "https://fastapi.tiangolo.com/", "source": "Official Documentation", "resourceType": "Documentation", "difficulty": "Medium", "deptId": 2},
    {"topic": "AWS", "title": "AWS Certified AI Practitioner & Amazon Bedrock Guide", "url": "https://aws.amazon.com/machine-learning/", "source": "AWS", "resourceType": "Documentation", "difficulty": "Medium", "deptId": 2},
    {"topic": "Generative AI", "title": "Generative AI for Beginners", "url": "https://github.com/microsoft/generative-ai-for-beginners", "source": "Udemy / Microsoft", "resourceType": "Course", "difficulty": "Beginner", "deptId": 2},
    {"topic": "Generative AI", "title": "Langchain for beginners : Build GenAI LLM Apps in Easy Steps", "url": "https://python.langchain.com/docs/get_started/introduction", "source": "Udemy / LangChain", "resourceType": "Course", "difficulty": "Medium", "deptId": 2},
    {"topic": "Generative AI", "title": "LangGraph for beginners : Agentic Workflows in simple steps", "url": "https://langchain-ai.github.io/langgraph/", "source": "Udemy / LangGraph", "resourceType": "Course", "difficulty": "Advanced", "deptId": 2},
    {"topic": "PowerBI", "title": "Microsoft Learn Power BI Analytics & AI Dashboards", "url": "https://learn.microsoft.com/en-us/power-bi/", "source": "Microsoft Learn", "resourceType": "Documentation", "difficulty": "Medium", "deptId": 2},

    # DCG (Dept 3)
    {"topic": "SQL", "title": "W3Schools Interactive SQL Reference & Practice", "url": "https://www.w3schools.com/sql/", "source": "W3Schools", "resourceType": "Tutorial", "difficulty": "Beginner", "deptId": 3},
    {"topic": "Python", "title": "Official Python 3.12 Reference & Enterprise Applications", "url": "https://docs.python.org/3/", "source": "Official Documentation", "resourceType": "Documentation", "difficulty": "Beginner", "deptId": 3},
    {"topic": "PySpark", "title": "Apache Spark & PySpark Official Programming Guide", "url": "https://spark.apache.org/docs/latest/api/python/", "source": "Official Documentation", "resourceType": "Documentation", "difficulty": "Advanced", "deptId": 3},
    {"topic": "Databricks", "title": "Databricks Lakehouse & Delta Lake Developer Architecture", "url": "https://docs.databricks.com/", "source": "Databricks", "resourceType": "Documentation", "difficulty": "Advanced", "deptId": 3},
    {"topic": "AWS", "title": "AWS Cloud Software Engineering & DevOps Guide", "url": "https://aws.amazon.com/training/", "source": "AWS", "resourceType": "Documentation", "difficulty": "Medium", "deptId": 3},
    {"topic": "PowerBI", "title": "Microsoft Learn Power BI Data Visualization Guide", "url": "https://learn.microsoft.com/en-us/power-bi/", "source": "Microsoft Learn", "resourceType": "Documentation", "difficulty": "Medium", "deptId": 3},
    {"topic": "Real-time Practice", "title": "LeetCode 75 Essential Study Plan & Software Practice", "url": "https://leetcode.com/studyplan/leetcode-75/", "source": "LeetCode", "resourceType": "Practice", "difficulty": "Medium", "deptId": 3}
]

def classify_departments_for_resource(resource_data: dict, dept_code_to_id: dict) -> list:
    text = (
        f"{resource_data.get('title', '')} "
        f"{resource_data.get('description', '')} "
        f"{resource_data.get('skills', '')} "
        f"{resource_data.get('category', '')}"
    ).lower()

    de_score = 0
    de_keywords = ["data", "sql", "etl", "pipeline", "spark", "hadoop", "kafka", "airflow", "warehouse", "database", "pandas", "databricks", "analytics", "bi"]
    for kw in de_keywords:
        if kw in text: de_score += 1

    cognitive_score = 0
    cognitive_keywords = ["ai", "artificial intelligence", "ml", "machine learning", "deep learning", "nlp", "llm", "gpt", "genai", "generative ai", "computer vision", "neural network", "ai agent", "cognitive"]
    for kw in cognitive_keywords:
        if kw in text: cognitive_score += 1

    dcg_score = 0
    dcg_keywords = ["cloud", "aws", "azure", "gcp", "devops", "docker", "kubernetes", "cybersecurity", "security", "full stack", "web", "software", "application", "blockchain", "infrastructure", "governance"]
    for kw in dcg_keywords:
        if kw in text: dcg_score += 1

    matched_dept_ids = []
    if de_score > 0 and "DE" in dept_code_to_id:
        matched_dept_ids.append(dept_code_to_id["DE"])
    if cognitive_score > 0 and "COGNITIVE" in dept_code_to_id:
        matched_dept_ids.append(dept_code_to_id["COGNITIVE"])
    if dcg_score > 0 and "DCG" in dept_code_to_id:
        matched_dept_ids.append(dept_code_to_id["DCG"])

    if not matched_dept_ids:
        matched_dept_ids = list(dept_code_to_id.values())

    return list(set(matched_dept_ids))

def generate_resources_batch(department_id: int = None, topic: str = None, difficulty: str = None, count: int = 10, source: str = None) -> dict:
    """
    Automated Resource Discovery & Generation Engine.
    Generates curated technical resources with deduplication and department taxonomy mapping.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    generated_count = 0

    try:
        candidates = list(TRUSTED_RESOURCE_CATALOG)
        
        try:
            dept_int = int(department_id) if department_id and str(department_id).isdigit() else 0
        except (ValueError, TypeError):
            dept_int = 0

        if dept_int != 0:
            candidates = [c for c in candidates if c.get("deptId") == dept_int or c.get("deptId") == 1]
            
        if topic and str(topic).lower() != "all":
            filtered_c = [c for c in candidates if str(topic).lower() in c.get("topic", "").lower() or str(topic).lower() in c.get("title", "").lower()]
            if filtered_c:
                candidates = filtered_c
            
        if difficulty and str(difficulty).lower() != "all":
            filtered_d = [c for c in candidates if c.get("difficulty", "").lower() == str(difficulty).lower()]
            if filtered_d:
                candidates = filtered_d

        if not candidates:
            candidates = list(TRUSTED_RESOURCE_CATALOG)

        target_items = candidates[:count]
        
        for item in target_items:
            src = item.get("source", "Official Documentation")
            src_id = f"auto_{item['topic'].lower()}_{hash(item['url']) & 0xFFFFFFFF}"
            url = item["url"]
            
            cursor.execute("SELECT id FROM learning_resources WHERE url = ? OR (source = ? AND sourceId = ?)", (url, src, src_id))
            row = cursor.fetchone()
            
            target_dept_ids = [1, 2, 3] if (not department_id or department_id == 0) else [department_id]
            dept_name = "All Departments" if (not department_id or department_id == 0) else ("Data Engineering" if department_id == 1 else "Cognitive Technology" if department_id == 2 else "DCG")

            if not row:
                cursor.execute("""
                    INSERT INTO learning_resources (
                        title, description, url, source, sourceId, resourceType, category,
                        skills, difficulty, department, departmentId, topic, skill, technology,
                        status, isActive, createdAt, updatedAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?)
                """, (
                    item["title"],
                    item.get("description") or f"Comprehensive {item['topic']} resource from {src} covering key engineering principles and practical implementations.",
                    url,
                    src,
                    src_id,
                    item.get("resourceType", "Tutorial"),
                    item.get("topic", "General"),
                    f"{item['topic']}, Programming, System Design",
                    item.get("difficulty", "Beginner"),
                    dept_name,
                    target_dept_ids[0],
                    item.get("topic", "General"),
                    item.get("topic", "General"),
                    item.get("topic", "General"),
                    now,
                    now
                ))
                res_id = cursor.lastrowid
                generated_count += 1
            else:
                res_id = row[0]
                cursor.execute("""
                    UPDATE learning_resources SET
                        status = 'ACTIVE', isActive = 1, updatedAt = ?
                    WHERE id = ?
                """, (now, res_id))
                generated_count += 1

            # Map across all target departments
            for d_id in target_dept_ids:
                cursor.execute("""
                    INSERT OR IGNORE INTO learning_resource_departments (learningResourceId, departmentId, createdAt)
                    VALUES (?, ?, ?)
                """, (res_id, d_id, now))

        conn.commit()
        return {
            "success": True,
            "message": f"Successfully generated and cataloged {generated_count} learning resources.",
            "generatedCount": generated_count
        }
    finally:
        conn.close()

def sync_resources(source_code: str = None) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, code FROM departments WHERE isActive = 1")
    dept_code_to_id = {row["code"]: row["id"] for row in cursor.fetchall()}

    connectors_to_run = []
    if source_code:
        code_upper = source_code.upper()
        if code_upper in RESOURCE_CONNECTORS:
            connectors_to_run.append(RESOURCE_CONNECTORS[code_upper])
    else:
        connectors_to_run = list(RESOURCE_CONNECTORS.values())

    if not connectors_to_run:
        conn.close()
        return {
            "status": "error",
            "source": source_code or "ALL",
            "message": f"No valid resource connector found for code '{source_code}'."
        }

    total_fetched = 0
    new_added = 0
    updated = 0
    total_mappings = 0
    now = datetime.now().isoformat()

    for connector in connectors_to_run:
        code = connector.source_code
        items = connector.fetch_resources(limit=15)
        total_fetched += len(items)

        for item in items:
            src_id = item["sourceId"]
            cursor.execute("SELECT id FROM learning_resources WHERE source = ? AND sourceId = ?", (code, src_id))
            existing = cursor.fetchone()

            if existing:
                res_id = existing["id"]
                cursor.execute("""
                    UPDATE learning_resources SET
                        title = ?, description = ?, url = ?, resourceType = ?, category = ?,
                        skills = ?, difficulty = ?, thumbnail = ?, author = ?, publishedAt = ?,
                        lastSyncedAt = ?, isActive = 1, updatedAt = ?
                    WHERE id = ?
                """, (
                    item["title"], item["description"], item["url"], item["resourceType"], item["category"],
                    item["skills"], item["difficulty"], item["thumbnail"], item["author"], item["publishedAt"],
                    now, now, res_id
                ))
                updated += 1
            else:
                cursor.execute("""
                    INSERT INTO learning_resources (
                        title, description, url, source, sourceId, resourceType, category,
                        skills, difficulty, thumbnail, author, publishedAt, lastSyncedAt,
                        isActive, createdAt, updatedAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
                """, (
                    item["title"], item["description"], item["url"], code, src_id, item["resourceType"], item["category"],
                    item["skills"], item["difficulty"], item["thumbnail"], item["author"], item["publishedAt"], now,
                    now, now
                ))
                res_id = cursor.lastrowid
                new_added += 1

            matched_dept_ids = classify_departments_for_resource(item, dept_code_to_id)
            cursor.execute("DELETE FROM learning_resource_departments WHERE learningResourceId = ?", (res_id,))
            for dept_id in matched_dept_ids:
                cursor.execute("""
                    INSERT INTO learning_resource_departments (learningResourceId, departmentId, createdAt)
                    VALUES (?, ?, ?)
                """, (res_id, dept_id, now))
                total_mappings += 1

        cursor.execute("UPDATE sources SET lastSyncAt = ?, updatedAt = ? WHERE code = ?", (now, now, code))

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "source": source_code or "ALL_RESOURCES",
        "syncedAt": now,
        "totalFetched": total_fetched,
        "newAdded": new_added,
        "updated": updated,
        "departmentMappingsCreated": total_mappings,
        "message": f"Successfully synchronized {total_fetched} learning resources."
    }
