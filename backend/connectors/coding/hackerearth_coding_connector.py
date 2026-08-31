import urllib.request
import json
from typing import List, Dict, Any
from connectors.coding.base_coding_connector import BaseCodingConnector

class HackerEarthCodingConnector(BaseCodingConnector):
    """
    Modular Connector for HackerEarth public challenges feed.
    """

    @property
    def source_code(self) -> str:
        return "HACKEREARTH"

    @property
    def source_name(self) -> str:
        return "HackerEarth"

    def fetch_problems(self, limit: int = 20) -> List[Dict[str, Any]]:
        url = "https://www.hackerearth.com/api/events/upcoming/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json"
        }
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    events = data.get("response", [])
                    normalized = []
                    for idx, item in enumerate(events[:limit]):
                        title = item.get("title")
                        challenge_url = item.get("url") or "https://www.hackerearth.com/challenges/"
                        if title:
                            normalized.append({
                                "source": self.source_code,
                                "sourceId": f"he-{idx+1}",
                                "title": f"{title} (HackerEarth)",
                                "description": f"HackerEarth Challenge: {title}",
                                "url": challenge_url,
                                "difficulty": "Easy",
                                "rating": 1000,
                                "tags": "hackerearth, competitive-programming",
                                "skills": "Python, Problem Solving",
                                "language": "Python",
                                "category": "Algorithms",
                                "isActive": True
                            })
                    return normalized
        except Exception as e:
            print(f"HackerEarth Coding Connector unavailable: {e}")
            return []

        return []
