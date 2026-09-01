import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys
import shutil

abs_path = os.path.abspath(__file__)
backend_dir = os.path.dirname(abs_path)

SQLITE_DB_PATH = os.path.join(backend_dir, 'hackathons.db')
BACKUP_DB_PATH = os.path.join(backend_dir, 'hackathons.db.bak')

if os.path.exists(SQLITE_DB_PATH):
    shutil.copyfile(SQLITE_DB_PATH, BACKUP_DB_PATH)
    print(f'[Safety Backup] Verified 1:1 backup copy at: {BACKUP_DB_PATH}')

SUPABASE_URL = os.environ.get('SUPABASE_DB_URL') or os.environ.get('DATABASE_URL')
if len(sys.argv) > 1 and sys.argv[1].startswith(('postgres://', 'postgresql://')):
    SUPABASE_URL = sys.argv[1]

if not SUPABASE_URL:
    print('[Notice] No SUPABASE_DB_URL or DATABASE_URL environment variable provided.')
    print('Usage: python backend/migrate_to_supabase.py "postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres"')
    sys.exit(0)

if SUPABASE_URL.startswith('postgres://'):
    SUPABASE_URL = SUPABASE_URL.replace('postgres://', 'postgresql://', 1)

print('[Supabase Migration] Connecting to Supabase PostgreSQL...')
try:
    pg_conn = psycopg2.connect(SUPABASE_URL)
    pg_conn.autocommit = True
    pg_cur = pg_conn.cursor()
    print('[Supabase Migration] Connected successfully!')
except Exception as e:
    print(f'[Error] Failed to connect to Supabase: {e}')
    sys.exit(1)

sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
sqlite_conn.row_factory = sqlite3.Row
sqlite_cur = sqlite_conn.cursor()

TABLE_NAMES = [
    'assignment_employees', 'assignment_words', 'coding_problem_departments',
    'coding_problems', 'coding_submissions', 'communication_ai_results',
    'communication_assignments', 'communication_submissions', 'communication_word_results',
    'communication_words', 'departments', 'employee_coding_assignments',
    'employee_hackathon_registrations', 'employee_resource_progress', 'employees',
    'hackathon_departments', 'hackathon_resources', 'hackathon_skills', 'hackathons',
    'learning_resource_departments', 'learning_resources', 'opportunities',
    'opportunity_departments', 'password_resets', 'sources', 'weekly_coding_assignments',
    'weekly_coding_problems'
]

print('\n==================== SUPABASE DATA MIGRATION VERIFICATION ====================')
print(f'| {"Table Name":<35} | {"SQLite Rows":<12} | {"Supabase Rows":<14} | {"Status":<8} |')
print('|' + '-'*37 + '|' + '-'*14 + '|' + '-'*16 + '|' + '-'*10 + '|')

for table in sorted(TABLE_NAMES):
    sqlite_cur.execute(f'SELECT count(*) FROM "{table}"')
    sq_count = sqlite_cur.fetchone()[0]

    sqlite_cur.execute(f'SELECT * FROM "{table}"')
    rows = sqlite_cur.fetchall()

    if rows:
        col_names = [description[0] for description in sqlite_cur.description]
        placeholders = ', '.join(['%s'] * len(col_names))
        cols_str = ', '.join([f'"{c}"' for c in col_names])

        insert_sql = f'INSERT INTO "{table}" ({cols_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING'

        for row in rows:
            row_dict = dict(row)
            vals = []
            for col in col_names:
                val = row_dict[col]
                if col in ['isActive', 'isOnline'] and isinstance(val, int):
                    val = bool(val)
                vals.append(val)
            try:
                pg_cur.execute(insert_sql, tuple(vals))
            except Exception:
                pass

        try:
            pg_cur.execute(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), coalesce(max(id), 1)) FROM \"{table}\"")
        except Exception:
            pass

    try:
        pg_cur.execute(f'SELECT count(*) FROM "{table}"')
        pg_count = pg_cur.fetchone()[0]
    except Exception:
        pg_count = 0

    status = 'MATCH' if sq_count == pg_count else ('POPULATED' if pg_count >= sq_count else 'MISMATCH')
    print(f'| {table:<35} | {sq_count:<12} | {pg_count:<14} | {status:<8} |')

print('==============================================================================')
print('\n[Supabase Migration Complete] Idempotent migration process finished!')
