import sqlite3
from datetime import datetime

def seed_department_curriculum():
    conn = sqlite3.connect('hackathons.db')
    cursor = conn.cursor()
    now = datetime.now().isoformat()

    # 1. Purge generic DEVTO blog posts and placeholder resources
    cursor.execute("""
        DELETE FROM learning_resources 
        WHERE source = 'DEVTO' 
           OR title LIKE '%Building an AI Engineering%'
           OR title LIKE '%Delivered, accepted%'
           OR title LIKE '%We rotated a credential%'
           OR title LIKE '%Our Post-Mortem%'
           OR title LIKE '%Mac Studio M5%'
           OR title LIKE '%Did FP8 make%'
           OR url LIKE '%example.com%'
           OR url = '#'
           OR url IS NULL
           OR url = ''
    """)
    purged_count = cursor.rowcount
    print(f"Purged {purged_count} generic/placeholder resources.")

    # Clean orphaned junction mappings
    cursor.execute("""
        DELETE FROM learning_resource_departments 
        WHERE learningResourceId NOT IN (SELECT id FROM learning_resources)
    """)

    # 2. Master Department Curriculum Catalog
    curriculum = [
        # ================= DATA ENGINEERING (Dept 1) =================
        {
            "deptId": 1, "deptName": "Data Engineering", "topic": "SQL", "skill": "SQL", "technology": "SQL",
            "title": "W3Schools Interactive SQL Tutorial & Exercises",
            "description": "Comprehensive step-by-step SQL queries, JOINs, Group By, Subqueries, and interactive browser exercises.",
            "url": "https://www.w3schools.com/sql/", "source": "W3Schools", "resourceType": "Tutorial", "difficulty": "Beginner"
        },
        {
            "deptId": 1, "deptName": "Data Engineering", "topic": "SQL", "skill": "SQL", "technology": "SQL",
            "title": "GeeksforGeeks Advanced SQL & PL/SQL Masterclass",
            "description": "Advanced query optimization, window functions, indexing, CTEs, and database administration.",
            "url": "https://www.geeksforgeeks.org/sql-tutorial/", "source": "GeeksforGeeks", "resourceType": "Practice", "difficulty": "Medium"
        },
        {
            "deptId": 1, "deptName": "Data Engineering", "topic": "PySpark", "skill": "PySpark", "technology": "Apache Spark",
            "title": "Apache Spark & PySpark Official Documentation & Guide",
            "description": "Official programming guide for PySpark DataFrames, Spark SQL, Streaming, and RDD operations.",
            "url": "https://spark.apache.org/docs/latest/api/python/", "source": "Official Documentation", "resourceType": "Documentation", "difficulty": "Advanced"
        },
        {
            "deptId": 1, "deptName": "Data Engineering", "topic": "PySpark", "skill": "PySpark", "technology": "Apache Spark",
            "title": "GeeksforGeeks PySpark Dataframe Tutorial & Hands-on Examples",
            "description": "Practical PySpark transformation, aggregation, and distributed computing examples.",
            "url": "https://www.geeksforgeeks.org/pyspark-tutorial/", "source": "GeeksforGeeks", "resourceType": "Tutorial", "difficulty": "Medium"
        },
        {
            "deptId": 1, "deptName": "Data Engineering", "topic": "Python", "skill": "Python", "technology": "Python",
            "title": "Official Python 3.12 Language & Standard Library Reference",
            "description": "Complete official Python language reference, built-in functions, modules, and data structures.",
            "url": "https://docs.python.org/3/", "source": "Official Documentation", "resourceType": "Documentation", "difficulty": "Beginner"
        },
        {
            "deptId": 1, "deptName": "Data Engineering", "topic": "Python", "skill": "Python", "technology": "Python",
            "title": "Real Python Data Engineering & Automation Guides",
            "description": "Real-world Python tutorials on data parsing, Pandas, automation scripts, and backend tools.",
            "url": "https://realpython.com/", "source": "Real Python", "resourceType": "Tutorial", "difficulty": "Medium"
        },
        {
            "deptId": 1, "deptName": "Data Engineering", "topic": "Databricks", "skill": "Databricks", "technology": "Databricks",
            "title": "Databricks Lakehouse Platform & Delta Lake Guide",
            "description": "Official Databricks documentation for building scalable lakehouse architectures and Delta tables.",
            "url": "https://docs.databricks.com/", "source": "Databricks", "resourceType": "Documentation", "difficulty": "Advanced"
        },
        {
            "deptId": 1, "deptName": "Data Engineering", "topic": "Real-time Practice", "skill": "SQL Practice", "technology": "SQL",
            "title": "LeetCode Top 50 SQL Study Plan & Practice Challenges",
            "description": "Curated 50 SQL interview problems covering SELECT, JOINs, Aggregates, and Subqueries.",
            "url": "https://leetcode.com/studyplan/sql-50/", "source": "LeetCode", "resourceType": "Practice", "difficulty": "Medium"
        },
        {
            "deptId": 1, "deptName": "Data Engineering", "topic": "Real-time Practice", "skill": "Database Queries", "technology": "SQL",
            "title": "HackerRank SQL Domain Practice & SQL Badges",
            "description": "Interactive SQL challenges ranging from basic queries to complex database manipulation.",
            "url": "https://www.hackerrank.com/domains/sql", "source": "HackerRank", "resourceType": "Practice", "difficulty": "Easy"
        },
        {
            "deptId": 1, "deptName": "Data Engineering", "topic": "AWS", "skill": "AWS Data", "technology": "AWS Cloud",
            "title": "AWS Certified Data Engineer & S3/Glue Analytics Guide",
            "description": "Amazon Web Services guide for AWS Glue, S3 data lakes, Redshift, and Athena analytics.",
            "url": "https://aws.amazon.com/training/", "source": "AWS", "resourceType": "Documentation", "difficulty": "Advanced"
        },
        {
            "deptId": 1, "deptName": "Data Engineering", "topic": "PowerBI", "skill": "PowerBI", "technology": "Power BI",
            "title": "Microsoft Learn Power BI Data Analyst Certification Guide",
            "description": "Learn DAX, data modeling, dashboard creation, and Power BI enterprise reporting.",
            "url": "https://learn.microsoft.com/en-us/power-bi/", "source": "Microsoft Learn", "resourceType": "Documentation", "difficulty": "Medium"
        },
        {
            "deptId": 1, "deptName": "Data Engineering", "topic": "Mini Hands-on Tasks", "skill": "DE Project", "technology": "Python ETL",
            "title": "Hands-on Beginner Data Engineering End-to-End Pipeline Project",
            "description": "Complete step-by-step mini project building a Python ETL pipeline from API to Postgres database.",
            "url": "https://github.com/josephmachado/beginner_de_project", "source": "GitHub", "resourceType": "Project Guide", "difficulty": "Beginner"
        },

        # ================= COGNITIVE TECHNOLOGY (Dept 2) =================
        {
            "deptId": 2, "deptName": "Cognitive Technology", "topic": "SQL", "skill": "SQL", "technology": "SQL",
            "title": "W3Schools Interactive SQL Reference & Practice",
            "description": "Interactive SQL tutorial and database query exercises.",
            "url": "https://www.w3schools.com/sql/", "source": "W3Schools", "resourceType": "Tutorial", "difficulty": "Beginner"
        },
        {
            "deptId": 2, "deptName": "Cognitive Technology", "topic": "Python", "skill": "Python", "technology": "Python",
            "title": "Official Python 3.12 Documentation & AI Libraries Reference",
            "description": "Official Python documentation for AI & Machine Learning developers.",
            "url": "https://docs.python.org/3/", "source": "Official Documentation", "resourceType": "Documentation", "difficulty": "Beginner"
        },
        {
            "deptId": 2, "deptName": "Cognitive Technology", "topic": "FastAPI", "skill": "FastAPI", "technology": "FastAPI",
            "title": "FastAPI Official Production Architecture Guide",
            "description": "High-performance Python web framework for building AI APIs and microservices.",
            "url": "https://fastapi.tiangolo.com/", "source": "Official Documentation", "resourceType": "Documentation", "difficulty": "Medium"
        },
        {
            "deptId": 2, "deptName": "Cognitive Technology", "topic": "AWS", "skill": "AWS AI", "technology": "AWS Bedrock",
            "title": "AWS Certified AI Practitioner & Amazon Bedrock Guide",
            "description": "AWS Generative AI services, Amazon Bedrock, SageMaker, and AI model deployment.",
            "url": "https://aws.amazon.com/machine-learning/", "source": "AWS", "resourceType": "Documentation", "difficulty": "Medium"
        },
        {
            "deptId": 2, "deptName": "Cognitive Technology", "topic": "Generative AI", "skill": "Generative AI", "technology": "LLM & GenAI",
            "title": "Generative AI for Beginners",
            "description": "Generative AI Made Easy: Start Your Generative AI Journey, Learn ChatGPT, LLM, Prompt engineering, Create GenAI Chatbot (11 of 11 sections • Enterprise • 4hr 28min).",
            "url": "https://github.com/microsoft/generative-ai-for-beginners", "source": "Udemy / Microsoft", "resourceType": "Course", "difficulty": "Beginner"
        },
        {
            "deptId": 2, "deptName": "Cognitive Technology", "topic": "Generative AI", "skill": "LangChain", "technology": "LangChain LLM",
            "title": "Langchain for beginners : Build GenAI LLM Apps in Easy Steps",
            "description": "A Step-by-Step Guide to Master LangChain, RAG pipelines, vector stores, and custom GenAI apps (17 of 17 sections • Enterprise • 4hr 49min).",
            "url": "https://python.langchain.com/docs/get_started/introduction", "source": "Udemy / LangChain", "resourceType": "Course", "difficulty": "Medium"
        },
        {
            "deptId": 2, "deptName": "Cognitive Technology", "topic": "Generative AI", "skill": "LangGraph", "technology": "AI Agents",
            "title": "LangGraph for beginners : Agentic Workflows in simple steps",
            "description": "Learn to Build Intelligent Agents, One Step at a Time, multi-agent supervision, and stateful graphs (17 of 17 sections • Enterprise • 3hr 12min).",
            "url": "https://langchain-ai.github.io/langgraph/", "source": "Udemy / LangGraph", "resourceType": "Course", "difficulty": "Advanced"
        },
        {
            "deptId": 2, "deptName": "Cognitive Technology", "topic": "PowerBI", "skill": "PowerBI", "technology": "Power BI",
            "title": "Microsoft Learn Power BI Analytics & AI Dashboards",
            "description": "Create intelligent Power BI dashboards, automated reports, and AI insights.",
            "url": "https://learn.microsoft.com/en-us/power-bi/", "source": "Microsoft Learn", "resourceType": "Documentation", "difficulty": "Medium"
        },

        # ================= DCG (Dept 3) =================
        {
            "deptId": 3, "deptName": "DCG", "topic": "SQL", "skill": "SQL", "technology": "SQL",
            "title": "W3Schools Interactive SQL Reference & Practice",
            "description": "Interactive SQL tutorial and database query exercises for software engineers.",
            "url": "https://www.w3schools.com/sql/", "source": "W3Schools", "resourceType": "Tutorial", "difficulty": "Beginner"
        },
        {
            "deptId": 3, "deptName": "DCG", "topic": "Python", "skill": "Python", "technology": "Python",
            "title": "Official Python 3.12 Reference & Enterprise Applications",
            "description": "Complete Python programming reference for full-stack and backend software development.",
            "url": "https://docs.python.org/3/", "source": "Official Documentation", "resourceType": "Documentation", "difficulty": "Beginner"
        },
        {
            "deptId": 3, "deptName": "DCG", "topic": "PySpark", "skill": "PySpark", "technology": "Apache Spark",
            "title": "Apache Spark & PySpark Official Programming Guide",
            "description": "PySpark DataFrames, Spark SQL, and distributed data processing for software systems.",
            "url": "https://spark.apache.org/docs/latest/api/python/", "source": "Official Documentation", "resourceType": "Documentation", "difficulty": "Advanced"
        },
        {
            "deptId": 3, "deptName": "DCG", "topic": "Databricks", "skill": "Databricks", "technology": "Databricks",
            "title": "Databricks Lakehouse & Delta Lake Developer Architecture",
            "description": "Enterprise cloud databricks architecture and analytics engineering.",
            "url": "https://docs.databricks.com/", "source": "Databricks", "resourceType": "Documentation", "difficulty": "Advanced"
        },
        {
            "deptId": 3, "deptName": "DCG", "topic": "AWS", "skill": "AWS Cloud", "technology": "AWS Cloud",
            "title": "AWS Cloud Software Engineering & DevOps Guide",
            "description": "AWS Cloud Practitioner, EC2, Lambda, S3, and cloud infrastructure deployment.",
            "url": "https://aws.amazon.com/training/", "source": "AWS", "resourceType": "Documentation", "difficulty": "Medium"
        },
        {
            "deptId": 3, "deptName": "DCG", "topic": "PowerBI", "skill": "PowerBI", "technology": "Power BI",
            "title": "Microsoft Learn Power BI Data Visualization Guide",
            "description": "Build interactive software analytics dashboards and business intelligence reports.",
            "url": "https://learn.microsoft.com/en-us/power-bi/", "source": "Microsoft Learn", "resourceType": "Documentation", "difficulty": "Medium"
        },
        {
            "deptId": 3, "deptName": "DCG", "topic": "Real-time Practice", "skill": "LeetCode Coding", "technology": "Algorithms",
            "title": "LeetCode 75 Essential Study Plan & Software Practice",
            "description": "75 curated LeetCode algorithms and data structures problems for tech interview prep.",
            "url": "https://leetcode.com/studyplan/leetcode-75/", "source": "LeetCode", "resourceType": "Practice", "difficulty": "Medium"
        }
    ]

    added_count = 0
    for item in curriculum:
        src = item["source"]
        src_id = f"curriculum_{item['deptId']}_{hash(item['title']) & 0xFFFFFFFF}"
        
        cursor.execute("SELECT id FROM learning_resources WHERE url = ?", (item["url"],))
        existing = cursor.fetchone()

        if not existing:
            cursor.execute("""
                INSERT INTO learning_resources (
                    title, description, url, source, sourceId, resourceType, category,
                    skills, difficulty, department, departmentId, topic, skill, technology,
                    status, isActive, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?)
            """, (
                item["title"], item["description"], item.get("url"), src, src_id,
                item["resourceType"], item["topic"], item["skill"], item["difficulty"],
                item["deptName"], item["deptId"], item["topic"], item["skill"], item["technology"],
                now, now
            ))
            res_id = cursor.lastrowid
            added_count += 1
        else:
            res_id = existing[0]
            cursor.execute("""
                UPDATE learning_resources SET
                    title = ?, description = ?, resourceType = ?, category = ?,
                    skills = ?, difficulty = ?, department = ?, departmentId = ?,
                    topic = ?, skill = ?, technology = ?, status = 'ACTIVE', isActive = 1, updatedAt = ?
                WHERE id = ?
            """, (
                item["title"], item["description"], item["resourceType"], item["topic"],
                item["skill"], item["difficulty"], item["deptName"], item["deptId"],
                item["topic"], item["skill"], item["technology"], now, res_id
            ))

        # Junction Mapping
        cursor.execute("""
            INSERT OR IGNORE INTO learning_resource_departments (learningResourceId, departmentId, createdAt)
            VALUES (?, ?, ?)
        """, (res_id, item["deptId"], now))

    conn.commit()
    conn.close()
    print(f"Successfully seeded {added_count} department curriculum learning resources!")

if __name__ == "__main__":
    seed_department_curriculum()
