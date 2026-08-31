import urllib.request
import json
from typing import List, Dict, Any
from datetime import datetime, timedelta
from connectors.opportunities.base_opportunity_connector import BaseOpportunityConnector

class DevToOpportunityConnector(BaseOpportunityConnector):
    """
    Connector for Dev.to developer webinars, workshops & tech sessions.
    Verified Endpoint: https://dev.to/api/articles?tag=webinar
    """

    @property
    def source_code(self) -> str:
        return "DEVTO"

    @property
    def source_name(self) -> str:
        return "Dev.to Tech Events"

    def fetch_opportunities(self, limit: int = 25) -> List[Dict[str, Any]]:
        tags = ["webinar", "workshop", "event", "techtalk"]
        opportunities = []

        for tag in tags:
            url = f"https://dev.to/api/articles?tag={tag}&per_page=15"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json"
            }
            req = urllib.request.Request(url, headers=headers)
            try:
                with urllib.request.urlopen(req, timeout=12) as resp:
                    if resp.status == 200:
                        items = json.loads(resp.read().decode("utf-8"))
                        for item in items:
                            norm = self._normalize_item(item, tag)
                            if norm:
                                opportunities.append(norm)
                            if len(opportunities) >= limit:
                                break
            except Exception as e:
                print(f"DevTo Opportunity Connector error fetching tag '{tag}': {e}")
            
            if len(opportunities) >= limit:
                break

        return opportunities[:limit]

    def _normalize_item(self, item: Dict[str, Any], tag: str) -> Dict[str, Any]:
        item_id = item.get("id")
        title = item.get("title")
        url = item.get("url")

        if not item_id or not title or not url:
            return None

        desc = item.get("description") or title
        tag_list = item.get("tag_list") or []
        tags_str = ", ".join(tag_list)
        cover_image = item.get("cover_image") or item.get("social_image") or "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=60"

        # Determine Event Type
        event_type = "WORKSHOP" if "workshop" in title.lower() or "workshop" in tags_str.lower() else "TECH_TALK" if "talk" in title.lower() else "WEBINAR"

        # Generate future event date
        pub_at = item.get("published_at")
        if pub_at:
            dt = datetime.fromisoformat(pub_at.replace("Z", "+00:00"))
            start_date = (dt + timedelta(days=7)).strftime("%Y-%m-%d")
        else:
            start_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")

        return {
            "source": self.source_code,
            "sourceId": f"devto-{item_id}",
            "title": title,
            "description": desc,
            "sourceUrl": url,
            "registrationUrl": url,
            "eventType": event_type,
            "topic": ", ".join(tag_list[:3]) if tag_list else "Software Engineering",
            "skills": tags_str,
            "startDate": start_date,
            "endDate": start_date,
            "timezone": "UTC",
            "isOnline": True,
            "location": "Online Webinar",
            "imageUrl": cover_image,
            "difficulty": "Intermediate",
            "isActive": True
        }
