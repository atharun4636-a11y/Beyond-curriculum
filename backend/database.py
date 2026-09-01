import sqlite3
import os
from datetime import datetime
from utils.auth_utils import hash_password

import shutil

ORIG_DB_PATH = os.path.join(os.path.dirname(__file__), "hackathons.db")

# PostgreSQL Wrapper Classes for transparent SQLite / PostgreSQL compatibility
class PgCursorWrapper:
    def __init__(self, pg_cursor):
        self.cursor = pg_cursor

    def execute(self, sql, params=None):
        pg_sql = sql.replace('?', '%s')
        if 'INSERT OR IGNORE' in pg_sql:
            pg_sql = pg_sql.replace('INSERT OR IGNORE', 'INSERT')
            if 'ON CONFLICT' not in pg_sql:
                pg_sql += ' ON CONFLICT DO NOTHING'
        if 'INSERT OR REPLACE' in pg_sql:
            pg_sql = pg_sql.replace('INSERT OR REPLACE', 'INSERT')
            if 'ON CONFLICT' not in pg_sql:
                pg_sql += ' ON CONFLICT DO NOTHING'
        
        if pg_sql.strip().upper().startswith('PRAGMA'):
            return self

        if params is None:
            self.cursor.execute(pg_sql)
        else:
            self.cursor.execute(pg_sql, params)
        return self

    def executemany(self, sql, seq_of_params):
        pg_sql = sql.replace('?', '%s')
        if 'INSERT OR IGNORE' in pg_sql:
            pg_sql = pg_sql.replace('INSERT OR IGNORE', 'INSERT')
            if 'ON CONFLICT' not in pg_sql:
                pg_sql += ' ON CONFLICT DO NOTHING'
        self.cursor.executemany(pg_sql, seq_of_params)
        return self

    def fetchone(self):
        row = self.cursor.fetchone()
        if row is None:
            return None
        return dict(row)

    def fetchall(self):
        rows = self.cursor.fetchall()
        if not rows:
            return []
        return [dict(r) for r in rows]

    @property
    def lastrowid(self):
        try:
            res = self.cursor.fetchone()
            if res and isinstance(res, dict):
                return list(res.values())[0]
            if res:
                return res[0]
        except Exception:
            pass
        return None

class PgConnectionWrapper:
    def __init__(self, pg_conn):
        self.conn = pg_conn

    def cursor(self):
        import psycopg2.extras
        return PgCursorWrapper(self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor))

    def commit(self):
        try:
            self.conn.commit()
        except Exception:
            pass

    def close(self):
        try:
            self.conn.close()
        except Exception:
            pass

    def execute(self, sql, params=None):
        cur = self.cursor()
        cur.execute(sql, params)
        return cur

def get_db_connection():
    db_url = os.environ.get("SUPABASE_DB_URL") or os.environ.get("DATABASE_URL")
    if db_url:
        import psycopg2
        import psycopg2.extras
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        return PgConnectionWrapper(conn)

    # Local / Serverless SQLite Fallback
    if os.environ.get("VERCEL"):
        DB_PATH = "/tmp/hackathons.db"
        if (not os.path.exists(DB_PATH) or (os.path.exists(DB_PATH) and os.path.getsize(DB_PATH) == 0)) and os.path.exists(ORIG_DB_PATH):
            try:
                shutil.copyfile(ORIG_DB_PATH, DB_PATH)
            except Exception:
                pass
    else:
        DB_PATH = ORIG_DB_PATH

    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    conn.row_factory = sqlite3.Row
    try:
        if not os.environ.get("VERCEL"):
            conn.execute("PRAGMA journal_mode=WAL;")
        else:
            conn.execute("PRAGMA journal_mode=MEMORY;")
        conn.execute("PRAGMA busy_timeout=60000;")
    except Exception:
        pass
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    
    # 1. Hackathons Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hackathons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            statement TEXT DEFAULT '',
            organizer TEXT DEFAULT '',
            mode TEXT DEFAULT 'Online',
            location TEXT DEFAULT '',
            regLink TEXT DEFAULT '',
            lastDate TEXT DEFAULT '',
            eventDate TEXT DEFAULT '',
            poster TEXT DEFAULT '',
            description TEXT DEFAULT '',
            source TEXT DEFAULT 'manual',
            sourceId TEXT DEFAULT NULL,
            category TEXT DEFAULT NULL,
            skills TEXT DEFAULT NULL,
            eligibility TEXT DEFAULT NULL,
            teamSize TEXT DEFAULT NULL,
            sourceUrl TEXT DEFAULT '',
            lastSyncedAt TEXT DEFAULT NULL,
            isActive INTEGER DEFAULT 1,
            createdAt TEXT,
            updatedAt TEXT
        );
    """)

    cursor.execute("PRAGMA table_info(hackathons)")
    columns = [row['name'] for row in cursor.fetchall()]

    if "sourceUrl" not in columns:
        cursor.execute("ALTER TABLE hackathons ADD COLUMN sourceUrl TEXT DEFAULT ''")
    if "lastSyncedAt" not in columns:
        cursor.execute("ALTER TABLE hackathons ADD COLUMN lastSyncedAt TEXT DEFAULT NULL")
    if "eligibilityStatus" not in columns:
        cursor.execute("ALTER TABLE hackathons ADD COLUMN eligibilityStatus TEXT DEFAULT 'eligible'")
    if "eligibilityReason" not in columns:
        cursor.execute("ALTER TABLE hackathons ADD COLUMN eligibilityReason TEXT DEFAULT ''")

    # 2. Departments Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            code TEXT NOT NULL UNIQUE,
            isActive INTEGER DEFAULT 1,
            createdAt TEXT,
            updatedAt TEXT
        );
    """)

    # 3. Employees Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeId TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            departmentId INTEGER,
            role TEXT DEFAULT 'employee',
            isActive INTEGER DEFAULT 1,
            createdAt TEXT,
            updatedAt TEXT,
            FOREIGN KEY (departmentId) REFERENCES departments (id) ON DELETE SET NULL
        );
    """)

    # Safely ensure missing employee columns exist
    cursor.execute("PRAGMA table_info(employees)")
    emp_cols = [row['name'] for row in cursor.fetchall()]
    for col_name, col_def in [
        ("passwordHash", "TEXT DEFAULT NULL"),
        ("phone", "TEXT DEFAULT ''"),
        ("designation", "TEXT DEFAULT ''"),
        ("dateJoined", "TEXT DEFAULT ''"),
        ("score", "INTEGER DEFAULT 0"),
        ("photo", "TEXT DEFAULT ''")
    ]:
        if col_name not in emp_cols:
            try:
                cursor.execute(f"ALTER TABLE employees ADD COLUMN {col_name} {col_def}")
            except Exception:
                pass

    # 4. Sources Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            code TEXT NOT NULL UNIQUE,
            sourceType TEXT NOT NULL,
            baseUrl TEXT DEFAULT '',
            apiUrl TEXT DEFAULT '',
            isActive INTEGER DEFAULT 1,
            lastSyncAt TEXT DEFAULT NULL,
            createdAt TEXT,
            updatedAt TEXT
        );
    """)

    # 5. Hackathon Departments Junction Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hackathon_departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hackathonId INTEGER NOT NULL,
            departmentId INTEGER NOT NULL,
            createdAt TEXT,
            FOREIGN KEY (hackathonId) REFERENCES hackathons (id) ON DELETE CASCADE,
            FOREIGN KEY (departmentId) REFERENCES departments (id) ON DELETE CASCADE,
            UNIQUE(hackathonId, departmentId)
        );
    """)

    # 6. Learning Resources Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS learning_resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            url TEXT NOT NULL,
            source TEXT NOT NULL,
            sourceId TEXT NOT NULL,
            resourceType TEXT DEFAULT 'article',
            category TEXT DEFAULT '',
            skills TEXT DEFAULT '',
            difficulty TEXT DEFAULT 'Beginner',
            department TEXT DEFAULT '',
            departmentId INTEGER DEFAULT NULL,
            thumbnail TEXT DEFAULT '',
            author TEXT DEFAULT 'Admin',
            publishedAt TEXT DEFAULT NULL,
            lastSyncedAt TEXT DEFAULT NULL,
            isActive INTEGER DEFAULT 1,
            createdAt TEXT,
            updatedAt TEXT,
            UNIQUE(source, sourceId)
        );
    """)

    cursor.execute("PRAGMA table_info(learning_resources)")
    lr_cols = [row['name'] for row in cursor.fetchall()]
    for col_name, col_def in [
        ("topic", "TEXT DEFAULT ''"),
        ("skill", "TEXT DEFAULT ''"),
        ("technology", "TEXT DEFAULT ''"),
        ("tags", "TEXT DEFAULT ''"),
        ("status", "TEXT DEFAULT 'ACTIVE'")
    ]:
        if col_name not in lr_cols:
            try:
                cursor.execute(f"ALTER TABLE learning_resources ADD COLUMN {col_name} {col_def}")
            except Exception:
                pass

    # 7. Learning Resource Departments Junction Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS learning_resource_departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            learningResourceId INTEGER NOT NULL,
            departmentId INTEGER NOT NULL,
            createdAt TEXT,
            FOREIGN KEY (learningResourceId) REFERENCES learning_resources (id) ON DELETE CASCADE,
            FOREIGN KEY (departmentId) REFERENCES departments (id) ON DELETE CASCADE,
            UNIQUE(learningResourceId, departmentId)
        );
    """)

    # 7b. Hackathon Resources Mapping Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hackathon_resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hackathonId INTEGER NOT NULL,
            resourceId INTEGER NOT NULL,
            relevanceScore INTEGER DEFAULT 50,
            createdAt TEXT,
            FOREIGN KEY (hackathonId) REFERENCES hackathons (id) ON DELETE CASCADE,
            FOREIGN KEY (resourceId) REFERENCES learning_resources (id) ON DELETE CASCADE,
            UNIQUE(hackathonId, resourceId)
        );
    """)

    # 7c. Employee Resource Progress Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS employee_resource_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeId TEXT NOT NULL,
            resourceId INTEGER NOT NULL,
            status TEXT DEFAULT 'OPENED',
            openedAt TEXT DEFAULT NULL,
            completedAt TEXT DEFAULT NULL,
            FOREIGN KEY (resourceId) REFERENCES learning_resources (id) ON DELETE CASCADE,
            UNIQUE(employeeId, resourceId)
        );
    """)

    # 7d. Hackathon Skills Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hackathon_skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hackathonId INTEGER NOT NULL,
            skill TEXT NOT NULL,
            FOREIGN KEY (hackathonId) REFERENCES hackathons (id) ON DELETE CASCADE,
            UNIQUE(hackathonId, skill)
        );
    """)

    # 8. Coding Problems Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS coding_problems (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            url TEXT NOT NULL,
            source TEXT NOT NULL,
            sourceId TEXT NOT NULL,
            difficulty TEXT NOT NULL DEFAULT 'Easy',
            rating INTEGER DEFAULT 0,
            tags TEXT DEFAULT '',
            skills TEXT DEFAULT '',
            departmentId INTEGER DEFAULT NULL,
            language TEXT DEFAULT 'Python',
            category TEXT DEFAULT 'Algorithms',
            lastSyncedAt TEXT DEFAULT NULL,
            isActive INTEGER DEFAULT 1,
            createdAt TEXT,
            updatedAt TEXT,
            UNIQUE(source, sourceId)
        );
    """)

    cursor.execute("PRAGMA table_info(coding_problems)")
    cp_cols = [row['name'] for row in cursor.fetchall()]
    if "language" not in cp_cols:
        cursor.execute("ALTER TABLE coding_problems ADD COLUMN language TEXT DEFAULT 'Python'")
    if "category" not in cp_cols:
        cursor.execute("ALTER TABLE coding_problems ADD COLUMN category TEXT DEFAULT 'Algorithms'")

    # 9. Coding Problem Departments Junction Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS coding_problem_departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codingProblemId INTEGER NOT NULL,
            departmentId INTEGER NOT NULL,
            createdAt TEXT,
            FOREIGN KEY (codingProblemId) REFERENCES coding_problems (id) ON DELETE CASCADE,
            FOREIGN KEY (departmentId) REFERENCES departments (id) ON DELETE CASCADE,
            UNIQUE(codingProblemId, departmentId)
        );
    """)

    # 10. Weekly Coding Assignments Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS weekly_coding_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            weekStart TEXT NOT NULL UNIQUE,
            weekEnd TEXT NOT NULL,
            title TEXT NOT NULL,
            status TEXT DEFAULT 'Generated',
            createdAt TEXT,
            updatedAt TEXT
        );
    """)

    # 11. Weekly Coding Problems Junction Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS weekly_coding_problems (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assignmentId INTEGER NOT NULL,
            codingProblemId INTEGER NOT NULL,
            position INTEGER DEFAULT 1,
            createdAt TEXT,
            FOREIGN KEY (assignmentId) REFERENCES weekly_coding_assignments (id) ON DELETE CASCADE,
            FOREIGN KEY (codingProblemId) REFERENCES coding_problems (id) ON DELETE CASCADE,
            UNIQUE(assignmentId, codingProblemId)
        );
    """)

    # 12. Employee Coding Assignments Tracking Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS employee_coding_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assignmentId INTEGER NOT NULL,
            employeeId TEXT NOT NULL,
            codingProblemId INTEGER NOT NULL,
            status TEXT DEFAULT 'NOT_STARTED',
            startedAt TEXT DEFAULT NULL,
            submittedAt TEXT DEFAULT NULL,
            verifiedAt TEXT DEFAULT NULL,
            completedAt TEXT DEFAULT NULL,
            score INTEGER DEFAULT 0,
            createdAt TEXT,
            updatedAt TEXT,
            FOREIGN KEY (assignmentId) REFERENCES weekly_coding_assignments (id) ON DELETE CASCADE,
            FOREIGN KEY (codingProblemId) REFERENCES coding_problems (id) ON DELETE CASCADE,
            UNIQUE(assignmentId, employeeId, codingProblemId)
        );
    """)

    cursor.execute("PRAGMA table_info(employee_coding_assignments)")
    eca_cols = [row['name'] for row in cursor.fetchall()]
    if "startedAt" not in eca_cols:
        cursor.execute("ALTER TABLE employee_coding_assignments ADD COLUMN startedAt TEXT DEFAULT NULL")
    if "submittedAt" not in eca_cols:
        cursor.execute("ALTER TABLE employee_coding_assignments ADD COLUMN submittedAt TEXT DEFAULT NULL")
    if "verifiedAt" not in eca_cols:
        cursor.execute("ALTER TABLE employee_coding_assignments ADD COLUMN verifiedAt TEXT DEFAULT NULL")

    # 13. Coding Submissions Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS coding_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assignmentId INTEGER NOT NULL,
            employeeId TEXT NOT NULL,
            problemId INTEGER NOT NULL,
            language TEXT NOT NULL,
            solutionCode TEXT DEFAULT '',
            explanation TEXT DEFAULT '',
            externalSubmissionUrl TEXT DEFAULT '',
            outputResult TEXT DEFAULT '',
            submittedAt TEXT,
            reviewedAt TEXT DEFAULT NULL,
            reviewedBy TEXT DEFAULT NULL,
            reviewStatus TEXT DEFAULT 'SUBMITTED',
            reviewComment TEXT DEFAULT '',
            FOREIGN KEY (assignmentId) REFERENCES weekly_coding_assignments (id) ON DELETE CASCADE,
            FOREIGN KEY (problemId) REFERENCES coding_problems (id) ON DELETE CASCADE
        );
    """)

    cursor.execute("PRAGMA table_info(coding_submissions)")
    cs_cols = [row['name'] for row in cursor.fetchall()]
    if "outputResult" not in cs_cols:
        cursor.execute("ALTER TABLE coding_submissions ADD COLUMN outputResult TEXT DEFAULT ''")
    if "screenshotUrl" not in cs_cols:
        cursor.execute("ALTER TABLE coding_submissions ADD COLUMN screenshotUrl TEXT DEFAULT ''")

    # Seed 10 Real LeetCode & HackerRank Problems
    seed_problems = [
        ("Two Sum", "LEETCODE", "two-sum", "https://leetcode.com/problems/two-sum/", "Easy", "Python", "Data Structures"),
        ("Valid Parentheses", "LEETCODE", "valid-parentheses", "https://leetcode.com/problems/valid-parentheses/", "Easy", "Python", "Algorithms"),
        ("Group Anagrams", "LEETCODE", "group-anagrams", "https://leetcode.com/problems/group-anagrams/", "Medium", "Python", "Data Structures"),
        ("Longest Substring Without Repeating Characters", "LEETCODE", "longest-substring-without-repeating-characters", "https://leetcode.com/problems/longest-substring-without-repeating-characters/", "Medium", "Python", "Algorithms"),
        ("Merge k Sorted Lists", "LEETCODE", "merge-k-sorted-lists", "https://leetcode.com/problems/merge-k-sorted-lists/", "Hard", "Python", "Data Structures"),
        ("Select All", "HACKERRANK", "select-all-sql", "https://www.hackerrank.com/challenges/select-all-sql/problem", "Easy", "SQL", "Database Queries"),
        ("Revising the Select Query I", "HACKERRANK", "revising-the-select-query", "https://www.hackerrank.com/challenges/revising-the-select-query/problem", "Easy", "SQL", "Database Queries"),
        ("Weather Observation Station 5", "HACKERRANK", "weather-observation-station-5", "https://www.hackerrank.com/challenges/weather-observation-station-5/problem", "Medium", "SQL", "Database Queries"),
        ("Occupations Pivot", "HACKERRANK", "occupations", "https://www.hackerrank.com/challenges/occupations/problem", "Medium", "SQL", "Database Queries"),
        ("15 Days of Learning SQL", "HACKERRANK", "15-days-of-learning-sql", "https://www.hackerrank.com/challenges/15-days-of-learning-sql/problem", "Hard", "SQL", "Database Queries")
    ]

    for title, source, source_id, url, diff, lang, cat in seed_problems:
        cursor.execute("SELECT id FROM coding_problems WHERE source = ? AND sourceId = ?", (source, source_id))
        row = cursor.fetchone()
        if not row:
            cursor.execute("""
                INSERT INTO coding_problems (title, source, sourceId, url, difficulty, language, category, isActive, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            """, (title, source, source_id, url, diff, lang, cat, now, now))
        else:
            cursor.execute("""
                UPDATE coding_problems
                SET title = ?, url = ?, difficulty = ?, language = ?, category = ?, isActive = 1
                WHERE id = ?
            """, (title, url, diff, lang, cat, row[0]))
    conn.commit()

    # 13. Professional Opportunities & Webinars Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS opportunities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            source TEXT NOT NULL,
            sourceId TEXT NOT NULL,
            sourceUrl TEXT DEFAULT '',
            registrationUrl TEXT DEFAULT '',
            eventType TEXT DEFAULT 'WEBINAR',
            topic TEXT DEFAULT '',
            skills TEXT DEFAULT '',
            startDate TEXT DEFAULT '',
            endDate TEXT DEFAULT '',
            timezone TEXT DEFAULT 'UTC',
            isOnline INTEGER DEFAULT 1,
            location TEXT DEFAULT 'Online',
            imageUrl TEXT DEFAULT '',
            difficulty TEXT DEFAULT 'Intermediate',
            lastSyncedAt TEXT DEFAULT NULL,
            isActive INTEGER DEFAULT 1,
            createdAt TEXT,
            updatedAt TEXT,
            UNIQUE(source, sourceId)
        );
    """)

    # 14. Opportunity Departments Junction Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS opportunity_departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            opportunityId INTEGER NOT NULL,
            departmentId INTEGER NOT NULL,
            createdAt TEXT,
            FOREIGN KEY (opportunityId) REFERENCES opportunities (id) ON DELETE CASCADE,
            FOREIGN KEY (departmentId) REFERENCES departments (id) ON DELETE CASCADE,
            UNIQUE(opportunityId, departmentId)
        );
    """)

    conn.commit()

    now = datetime.now().isoformat()

    # Seed Departments if empty
    cursor.execute("SELECT COUNT(*) FROM departments")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("""
            INSERT INTO departments (name, code, isActive, createdAt, updatedAt)
            VALUES (?, ?, 1, ?, ?)
        """, [
            ("Data Engineering", "DE", now, now),
            ("Cognitive Technology", "COGNITIVE", now, now),
            ("DCG", "DCG", now, now)
        ])
        conn.commit()

    # 10. Password Resets Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS password_resets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            otp TEXT NOT NULL,
            expiresAt TEXT NOT NULL,
            createdAt TEXT NOT NULL
        )
    """)

    # Seed Sources if empty
    cursor.execute("SELECT COUNT(*) FROM sources")
    if cursor.fetchone()[0] == 0:
        initial_sources = [
            ("Unstop", "UNSTOP", "API", "https://unstop.com", "https://unstop.com/api/public/hackathons"),
            ("Devpost", "DEVPOST", "API_OR_FEED", "https://devpost.com", "https://devpost.com/api/hackathons"),
            ("HackerEarth", "HACKEREARTH", "API_OR_FEED", "https://www.hackerearth.com", "https://www.hackerearth.com/api/events/upcoming/"),
            ("GitHub", "GITHUB", "API", "https://github.com", "https://api.github.com/search/repositories"),
            ("Dev.to", "DEVTO", "API", "https://dev.to", "https://dev.to/api/articles"),
            ("Codeforces", "CODEFORCES", "API", "https://codeforces.com", "https://codeforces.com/api/problemset.problems"),
            ("LeetCode", "LEETCODE", "API", "https://leetcode.com", "https://leetcode.com/api/problems/all/")
        ]
        for name, code, s_type, base_url, api_url in initial_sources:
            cursor.execute("""
                INSERT INTO sources (name, code, sourceType, baseUrl, apiUrl, isActive, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?)
            """, (name, code, s_type, base_url, api_url, now, now))
        conn.commit()

    # Ensure default employees exist in database
    cursor.execute("SELECT id FROM departments WHERE code = 'DE'")
    de_row = cursor.fetchone()
    de_id = de_row[0] if de_row else 1
    cursor.execute("SELECT id FROM departments WHERE code = 'COGNITIVE'")
    cog_row = cursor.fetchone()
    cog_id = cog_row[0] if cog_row else 2

    for emp_tuple in [
        ("EMP001", "John Doe", "john.doe@company.com", de_id, "employee", hash_password("EMP001@2026"), "+123456789", "Senior Engineer", "2023-01-15", 85, "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60"),
        ("EMP002", "Jane Smith", "jane.smith@company.com", cog_id, "employee", hash_password("EMP002@2026"), "+123456780", "Product Manager", "2022-11-10", 90, "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60"),
        ("EMP003", "Robert Johnson", "robert.j@company.com", de_id, "employee", hash_password("EMP003@2026"), "+123456781", "QA Lead", "2024-03-01", 60, "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=60")
    ]:
        cursor.execute("SELECT id FROM employees WHERE employeeId = ?", (emp_tuple[0],))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO employees (employeeId, name, email, departmentId, role, isActive, passwordHash, phone, designation, dateJoined, score, photo, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (*emp_tuple, now, now))

    # Give existing employees default password hashes if NULL
    cursor.execute("SELECT id, employeeId, passwordHash FROM employees WHERE passwordHash IS NULL OR passwordHash = ''")
    unhashed = cursor.fetchall()
    for emp_row in unhashed:
        emp_id_code = emp_row["employeeId"]
        p_hash = hash_password(f"{emp_id_code}@2026")
        cursor.execute("UPDATE employees SET passwordHash = ? WHERE id = ?", (p_hash, emp_row["id"]))
    # 11. Communication Practice Tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS communication_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            assignedDate TEXT NOT NULL,
            dueDate TEXT DEFAULT '',
            difficulty TEXT DEFAULT 'Intermediate',
            departmentId INTEGER DEFAULT NULL,
            createdBy TEXT DEFAULT 'admin',
            status TEXT DEFAULT 'PUBLISHED',
            createdAt TEXT,
            updatedAt TEXT
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS communication_words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT NOT NULL UNIQUE,
            meaning TEXT NOT NULL,
            partOfSpeech TEXT DEFAULT 'Adjective',
            exampleSentence TEXT NOT NULL,
            pronunciation TEXT DEFAULT '',
            difficulty TEXT DEFAULT 'Intermediate',
            createdAt TEXT
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assignment_words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assignmentId INTEGER NOT NULL,
            wordId INTEGER NOT NULL,
            displayOrder INTEGER DEFAULT 1,
            FOREIGN KEY (assignmentId) REFERENCES communication_assignments (id) ON DELETE CASCADE,
            FOREIGN KEY (wordId) REFERENCES communication_words (id) ON DELETE CASCADE,
            UNIQUE(assignmentId, wordId)
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assignment_employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assignmentId INTEGER NOT NULL,
            employeeId TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            startedAt TEXT DEFAULT NULL,
            completedAt TEXT DEFAULT NULL,
            FOREIGN KEY (assignmentId) REFERENCES communication_assignments (id) ON DELETE CASCADE,
            UNIQUE(assignmentId, employeeId)
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS communication_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assignmentId INTEGER NOT NULL,
            employeeId TEXT NOT NULL,
            submissionType TEXT NOT NULL,
            storyText TEXT DEFAULT '',
            audioUrl TEXT DEFAULT '',
            transcript TEXT DEFAULT '',
            status TEXT DEFAULT 'SUBMITTED',
            submittedAt TEXT,
            FOREIGN KEY (assignmentId) REFERENCES communication_assignments (id) ON DELETE CASCADE
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS communication_ai_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            submissionId INTEGER NOT NULL UNIQUE,
            overallScore INTEGER DEFAULT 0,
            vocabularyScore INTEGER DEFAULT 0,
            grammarScore INTEGER DEFAULT 0,
            storyQualityScore INTEGER DEFAULT 0,
            contextScore INTEGER DEFAULT 0,
            wordsAssigned INTEGER DEFAULT 10,
            wordsUsed INTEGER DEFAULT 0,
            wordsCorrectlyUsed INTEGER DEFAULT 0,
            missingWords TEXT DEFAULT '[]',
            incorrectWords TEXT DEFAULT '[]',
            aiFeedback TEXT DEFAULT '{}',
            analyzedAt TEXT,
            FOREIGN KEY (submissionId) REFERENCES communication_submissions (id) ON DELETE CASCADE
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS communication_word_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aiResultId INTEGER NOT NULL,
            wordId INTEGER NOT NULL,
            word TEXT NOT NULL,
            used INTEGER DEFAULT 0,
            correctUsage INTEGER DEFAULT 0,
            contextScore INTEGER DEFAULT 0,
            evidence TEXT DEFAULT '',
            feedback TEXT DEFAULT '',
            FOREIGN KEY (aiResultId) REFERENCES communication_ai_results (id) ON DELETE CASCADE
        );
    """)

    # Seed 10 Advanced Vocabulary Words
    seed_words = [
        ("Meticulous", "Very careful, precise, and showing great attention to detail.", "Adjective", "She was meticulous when preparing financial reports for the board.", "muh-TIK-yuh-luss", "Advanced"),
        ("Resilient", "Able to withstand or recover quickly from difficult conditions or setbacks.", "Adjective", "The engineering team remained resilient despite the server migration outage.", "ruh-ZIL-yuhnt", "Intermediate"),
        ("Articulate", "Having or showing the ability to speak fluently and coherently.", "Adjective", "He gave an articulate presentation explaining complex data architecture.", "ar-TIK-yuh-lit", "Intermediate"),
        ("Ambiguous", "Open to more than one interpretation; not having one obvious meaning.", "Adjective", "The project specifications were too ambiguous to begin development.", "am-BIG-yoo-uhs", "Advanced"),
        ("Innovative", "Featuring new methods; advanced and original in thinking.", "Adjective", "The company launched an innovative AI-driven customer feedback module.", "IN-nuh-vay-tiv", "Intermediate"),
        ("Persuasive", "Good at persuading someone to do or believe something through reasoning.", "Adjective", "Her persuasive pitch convinced executive stakeholders to double the project budget.", "pur-SWAY-siv", "Intermediate"),
        ("Adaptable", "Able to adjust to new conditions or environment quickly.", "Adjective", "Developers must be adaptable to rapidly changing technology stacks.", "uh-DAP-tuh-buhl", "Intermediate"),
        ("Pragmatic", "Dealing with things sensibly and realistically based on practical considerations.", "Adjective", "Instead of choosing an expensive framework, the team adopted a pragmatic approach.", "prag-MAT-ik", "Advanced"),
        ("Empathetic", "Showing an ability to understand and share the feelings of others.", "Adjective", "An empathetic leader listens carefully to employee feedback.", "em-puh-THET-ik", "Intermediate"),
        ("Tenacious", "Tending to keep a firm hold of something; persistent and determined.", "Adjective", "His tenacious effort helped resolve the complex database deadlock bug.", "tuh-NAY-shuhs", "Advanced")
    ]

    word_ids = []
    for w_tuple in seed_words:
        cursor.execute("SELECT id FROM communication_words WHERE UPPER(word) = UPPER(?)", (w_tuple[0],))
        row = cursor.fetchone()
        if row:
            word_ids.append(row[0])
        else:
            cursor.execute("""
                INSERT INTO communication_words (word, meaning, partOfSpeech, exampleSentence, pronunciation, difficulty, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (*w_tuple, now))
            word_ids.append(cursor.lastrowid)

    # Seed Default Today Assignment (10 Words) if none published
    today_str = datetime.now().strftime("%Y-%m-%d")
    cursor.execute("SELECT id FROM communication_assignments WHERE assignedDate = ?", (today_str,))
    assg_row = cursor.fetchone()
    if not assg_row:
        cursor.execute("""
            INSERT INTO communication_assignments (title, description, assignedDate, dueDate, difficulty, createdBy, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, 'Advanced', 'admin', 'PUBLISHED', ?, ?)
        """, (
            "Daily Advanced Vocabulary Challenge",
            "Learn these 10 advanced words, then craft a cohesive story incorporating them. Submit via typing or voice recording.",
            today_str,
            today_str + " 23:59:59",
            now,
            now
        ))
        assg_id = cursor.lastrowid
        for order, w_id in enumerate(word_ids, start=1):
            cursor.execute("""
                INSERT OR IGNORE INTO assignment_words (assignmentId, wordId, displayOrder)
                VALUES (?, ?, ?)
            """, (assg_id, w_id, order))

    # 17. Employee Hackathon Registrations & Proof Verification Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS employee_hackathon_registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hackathonId INTEGER NOT NULL,
            employeeId TEXT NOT NULL,
            registrationStatus TEXT NOT NULL DEFAULT 'REGISTERED',
            proofType TEXT DEFAULT 'SCREENSHOT',
            proofScreenshot TEXT,
            proofUrl TEXT,
            notes TEXT,
            registeredAt TEXT NOT NULL,
            verifiedAt TEXT,
            verifiedBy TEXT,
            reviewComment TEXT,
            FOREIGN KEY (hackathonId) REFERENCES hackathons (id)
        )
    """)

    # Seed default hackathons if empty
    cursor.execute("SELECT COUNT(*) FROM hackathons")
    h_count_row = cursor.fetchone()
    h_count = h_count_row[0] if h_count_row else 0
    if h_count == 0:
        default_hacks = [
            ("AI Revolution Hackathon 2026", "Build next-generation generative AI agents for enterprise workflow automation.", "Google & OpenAI", "Online", "Global", "https://unstop.com", "2026-09-30", "2026-10-05", "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60", "Build innovative AI solutions.", "UNSTOP", "1", "Generative AI", "Python, LangChain, FastAPI", "All Engineering Stream", "1-4 Members"),
            ("CodeArena 2026", "High-speed algorithmic problem solving and optimization contest.", "HackerRank", "Online", "Global", "https://hackerrank.com", "2026-09-25", "2026-09-28", "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=60", "Algorithmic speed challenge.", "HACKERRANK", "2", "Algorithms", "Python, C++, Java, Data Structures", "Open to All", "Individual"),
            ("Innovest 3.0", "Cloud-native microservices architecture and serverless data pipeline hackathon.", "AWS & Microsoft", "Hybrid", "Bengaluru, India", "https://devpost.com", "2026-10-15", "2026-10-20", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=60", "Build resilient cloud systems.", "DEVPOST", "3", "Cloud & DevOps", "AWS, Docker, PySpark, SQL", "Full-time Employees", "2-5 Members")
        ]
        for name, stmt, org, mode, loc, rlink, ldate, edate, poster, desc, src, sid, cat, skl, elig, tsz in default_hacks:
            cursor.execute("""
                INSERT INTO hackathons (name, statement, organizer, mode, location, regLink, lastDate, eventDate, poster, description, source, sourceId, category, skills, eligibility, teamSize, isActive, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            """, (name, stmt, org, mode, loc, rlink, ldate, edate, poster, desc, src, sid, cat, skl, elig, tsz, now, now))
        conn.commit()

    # Map all active hackathons to active departments so they appear on Employee pages
    cursor.execute("""
        INSERT OR IGNORE INTO hackathon_departments (hackathonId, departmentId, createdAt)
        SELECT h.id, d.id, ?
        FROM hackathons h, departments d
        WHERE h.isActive = 1 AND d.isActive = 1
    """, (now,))
    conn.commit()
    conn.close()
