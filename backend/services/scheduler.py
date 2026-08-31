import threading
import time
import os
from datetime import datetime

from services.source_sync import sync_source
from services.resource_sync import sync_resources
from services.coding_sync import sync_coding_problems
from services.opportunity_sync import sync_opportunities
from services.weekly_assignment_service import generate_weekly_assignment

_SCHEDULER_RUNNING = False
_SCHEDULER_LOCK = threading.Lock()

def _run_initial_sync():
    print(f"[{datetime.now().isoformat()}] Background sync scheduler ready.")

def _background_loop():
    # Deferred periodic background sync (every 6 hours)
    time.sleep(30)
    print(f"[{datetime.now().isoformat()}] Starting background sync scheduler loop...")
    hackathon_interval = int(os.environ.get("HACKATHON_SYNC_INTERVAL_HOURS", 6)) * 3600
    resource_interval = int(os.environ.get("RESOURCE_SYNC_INTERVAL_HOURS", 12)) * 3600
    coding_interval = int(os.environ.get("CODING_SYNC_INTERVAL_HOURS", 12)) * 3600
    opportunity_interval = int(os.environ.get("OPPORTUNITY_SYNC_INTERVAL_HOURS", 12)) * 3600

    # Execute initial cycle
    _run_initial_sync()

    last_hackathon_sync = time.time()
    last_resource_sync = time.time()
    last_coding_sync = time.time()
    last_opportunity_sync = time.time()

    while True:
        time.sleep(30)
        now = time.time()

        if now - last_hackathon_sync >= hackathon_interval:
            try:
                sync_source("UNSTOP")
            except Exception as e:
                print(f"[Scheduler Loop] Hackathon sync error: {e}")
            last_hackathon_sync = time.time()

        if now - last_resource_sync >= resource_interval:
            try:
                sync_resources()
            except Exception as e:
                print(f"[Scheduler Loop] Resource sync error: {e}")
            last_resource_sync = time.time()

        if now - last_coding_sync >= coding_interval:
            try:
                sync_coding_problems("LEETCODE")
            except Exception as e:
                print(f"[Scheduler Loop] Coding sync error: {e}")
            last_coding_sync = time.time()

        if now - last_opportunity_sync >= opportunity_interval:
            try:
                sync_opportunities("ALL")
            except Exception as e:
                print(f"[Scheduler Loop] Opportunity sync error: {e}")
            last_opportunity_sync = time.time()


def start_scheduler():
    global _SCHEDULER_RUNNING
    with _SCHEDULER_LOCK:
        if _SCHEDULER_RUNNING:
            return
        _SCHEDULER_RUNNING = True
        t = threading.Thread(target=_background_loop, daemon=True)
        t.start()
        print("[Scheduler] Automated background sync scheduler initialized successfully.")
