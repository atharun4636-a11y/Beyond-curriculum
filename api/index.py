import sys
import os

# Add backend directory to python path for Vercel serverless execution
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from database import init_db
from main import app

# Ensure database tables and pre-seeded data are initialized on Vercel lambda startup
try:
    init_db()
except Exception as e:
    print(f"Vercel DB Startup Notice: {e}")
