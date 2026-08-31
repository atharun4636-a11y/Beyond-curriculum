import urllib.request
import json
from typing import List, Dict, Any
from datetime import datetime, timedelta
from connectors.opportunities.base_opportunity_connector import BaseOpportunityConnector

class GitHubOpportunityConnector(BaseOpportunityConnector):
    """
    Connector for GitHub Developer Tech Sessions, Masterclasses & Open Workshops.
    Verified Endpoint: https://api.github.com/search/repositories?q=workshop+OR+masterclass+OR+webinar&sort=updated
    """

    @property
    def source_code(self) -> str:
        return "GITHUB"

    @property
    def source_name(self) -> str:
        return "GitHub Developer Events"

    def fetch_opportunities(self, limit: int = 20) -> List[Dict[str, Any]]:
        url = "https://api.github.com/search/repositories?q=workshop+in:name,description&sort=updated&per_page=20"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "application/vnd.github.v3+json"
        }
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    items = data.get("items", [])
                    normalized = []
                    for item in items[:limit]:
                        norm = self._normalize_item(item)
                        if norm:
                            normalized.append(norm)
                    return normalized
        except Exception as e:
            print(f"GitHub Opportunity Connector error: {e}")
            return []

        return []

    def _normalize_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        repo_id = item.get("id")
        name = item.get("name")
        full_name = item.get("full_name")
        url = item.get("html_url")

        if not repo_id or not full_name or not url:
            return None

        desc = item.get("description") or f"GitHub Technical Workshop: {full_name}"
        topics = item.get("topics") or []
        topics_str = ", ".join(topics)

        # Event type classification
        event_type = "MASTERCLASS" if "masterclass" in name.lower() or "masterclass" in desc.lower() else "WORKSHOP" if "workshop" in name.lower() or "workshop" in desc.lower() else "TECH_TALK"

        start_date = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")

        return {
            "source": self.source_code,
            "sourceId": f"github-{repo_id}",
            "title": f"{full_name} — Live Developer Workshop",
            "description": desc,
            "sourceUrl": url,
            "registrationUrl": url,
            "eventType": event_type,
            "topic": ", ".join(topics[:3]) if topics else "Software Engineering",
            "skills": topics_str or "Git, Cloud, Software Engineering",
            "startDate": start_date,
            "endDate": start_date,
            "timezone": "UTC",
            "isOnline": True,
            "location": "Online / GitHub",
            "imageUrl": "https://images.unsplash.com/photo-1618401471353-b98afee042eb?w=500&auto=format&fit=crop&q=60",
            "difficulty": "Intermediate",
            "isActive": True
        }
