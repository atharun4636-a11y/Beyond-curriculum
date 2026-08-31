import re
from datetime import datetime
from database import get_db_connection

# Skill keywords mapping for automatic extraction from hackathon text
SKILL_KEYWORDS = {
    "Python": ["python", "py", "pandas", "numpy", "django", "flask", "fastapi"],
    "Java": ["java", "spring", "springboot", "jvm", "maven", "gradle"],
    "C++": ["c++", "cpp"],
    "SQL": ["sql", "postgres", "postgresql", "mysql", "queries", "database", "rdbms", "plsql"],
    "Machine Learning": ["machine learning", "ml", "sklearn", "scikit-learn", "regression", "classification"],
    "Generative AI": ["generative ai", "genai", "llm", "llms", "gpt", "prompt engineering", "openai", "claude", "langchain"],
    "AI Agents": ["ai agent", "ai agents", "autogen", "crewai", "agentic"],
    "Computer Vision": ["computer vision", "opencv", "yolo", "image processing", "vision"],
    "NLP": ["nlp", "text processing", "bert", "transformers", "huggingface"],
    "ETL": ["etl", "pipeline", "data pipeline", "airflow", "databricks", "spark", "pyspark"],
    "React": ["react", "react.js", "reactjs", "frontend", "ui/ux", "web"],
    "Node.js": ["node", "node.js", "nodejs", "express", "backend"],
    "FastAPI": ["fastapi", "rest api", "apis", "api integration"],
    "Cloud": ["cloud", "aws", "azure", "gcp", "docker", "kubernetes", "devops"]
}

def extract_skills_from_text(text: str) -> list:
    """Extracts known tech skills from hackathon titles, descriptions, and statements."""
    if not text:
        return ["Python", "Problem Solving"]
    
    text_lower = text.lower()
    matched_skills = []
    
    for skill_name, keywords in SKILL_KEYWORDS.items():
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                matched_skills.append(skill_name)
                break
                
    if not matched_skills:
        matched_skills = ["Hackathon Preparation", "Problem Statement Analysis", "Git/GitHub", "Deployment"]
        
    return list(set(matched_skills))

def match_hackathon_resources(hackathon_id: int) -> list:
    """
    Analyzes a hackathon, extracts required skills, finds matching learning resources,
    calculates relevance scores, and saves mappings in hackathon_resources.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM hackathons WHERE id = ?", (hackathon_id,))
        hack = cursor.fetchone()
        if not hack:
            return []
            
        hack_dict = dict(hack)
        combined_text = f"{hack_dict.get('name', '')} {hack_dict.get('description', '')} {hack_dict.get('statement', '')} {hack_dict.get('skills', '')}"
        
        skills = extract_skills_from_text(combined_text)
        now_str = datetime.now().isoformat()
        
        for sk in skills:
            cursor.execute("""
                INSERT OR IGNORE INTO hackathon_skills (hackathonId, skill)
                VALUES (?, ?)
            """, (hackathon_id, sk))
            
        cursor.execute("SELECT * FROM learning_resources WHERE isActive = 1 AND status = 'ACTIVE'")
        resources = [dict(r) for r in cursor.fetchall()]
        
        matched_resource_ids = []
        for res in resources:
            res_text = f"{res.get('title', '')} {res.get('description', '')} {res.get('topic', '')} {res.get('skills', '')} {res.get('technology', '')}".lower()
            score = 0
            
            for sk in skills:
                if sk.lower() in res_text:
                    score += 25
                    
            if "hackathon" in res_text or "preparation" in res_text or "project" in res_text or "github" in res_text:
                score += 20
                
            if score > 0:
                final_score = min(100, score + 30)
                cursor.execute("""
                    INSERT INTO hackathon_resources (hackathonId, resourceId, relevanceScore, createdAt)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(hackathonId, resourceId) DO UPDATE SET
                    relevanceScore = excluded.relevanceScore
                """, (hackathon_id, res["id"], final_score, now_str))
                matched_resource_ids.append((res["id"], final_score))
                
        conn.commit()
        return matched_resource_ids
    finally:
        conn.close()
