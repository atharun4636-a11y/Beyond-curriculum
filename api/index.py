import sys
import os

# Add backend directory to python path for Vercel serverless execution
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app
