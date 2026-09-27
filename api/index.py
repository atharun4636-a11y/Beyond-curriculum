import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/api/health")
def health():
    diag = {}
    try:
        import database
        diag["database_import"] = "OK"
    except Exception as e:
        diag["database_import"] = str(e)

    try:
        import models
        diag["models_import"] = "OK"
    except Exception as e:
        diag["models_import"] = str(e)

    try:
        from services.source_sync import sync_source
        diag["source_sync_import"] = "OK"
    except Exception as e:
        diag["source_sync_import"] = str(e)

    try:
        from services.coding_sync import sync_coding_problems
        diag["coding_sync_import"] = "OK"
    except Exception as e:
        diag["coding_sync_import"] = str(e)

    try:
        from services.opportunity_sync import sync_opportunities
        diag["opp_sync_import"] = "OK"
    except Exception as e:
        diag["opp_sync_import"] = str(e)

    try:
        from services.weekly_assignment_service import generate_weekly_assignment
        diag["weekly_service_import"] = "OK"
    except Exception as e:
        diag["weekly_service_import"] = str(e)

    try:
        import main
        diag["main_import"] = "OK"
    except Exception as e:
        diag["main_import"] = str(e)

    return diag










