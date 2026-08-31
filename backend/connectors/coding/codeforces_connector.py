import urllib.request
import json
from typing import List, Dict, Any
from connectors.coding.base_coding_connector import BaseCodingConnector

class CodeforcesConnector(BaseCodingConnector):
    """
    Connector for official Codeforces public API.
    Verified Endpoint: https://codeforces.com/api/problemset.problems
    """

    @property
    def source_code(self) -> str:
        return "CODEFORCES"

    @property
    def source_name(self) -> str:
        return "Codeforces"

    def fetch_problems(self, limit: int = 40) -> List[Dict[str, Any]]:
        url = "https://codeforces.com/api/problemset.problems"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json"
        }
        
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.status == 200:
                    raw_data = json.loads(resp.read().decode("utf-8"))
                    if raw_data.get("status") == "OK":
                        problems = raw_data.get("result", {}).get("problems", [])
                        normalized = []
                        for p in problems[:limit]:
                            norm = self._normalize_problem(p)
                            if norm:
                                normalized.append(norm)
                        return normalized
        except Exception as e:
            print(f"Codeforces Connector error fetching problems: {e}")
            return []

        return []

    def _normalize_problem(self, problem: Dict[str, Any]) -> Dict[str, Any]:
        contest_id = problem.get("contestId")
        index = problem.get("index")
        name = problem.get("name")
        
        if not contest_id or not index or not name:
            return None

        source_id = f"{contest_id}-{index}"
        url = f"https://codeforces.com/problemset/problem/{contest_id}/{index}"
        
        rating = problem.get("rating", 0)
        
        # Rating to Difficulty Mapping
        if rating > 0:
            if rating < 1200:
                difficulty = "Easy"
            elif 1200 <= rating <= 1599:
                difficulty = "Medium"
            else:
                difficulty = "Hard"
        else:
            difficulty = "Easy"

        tags_list = problem.get("tags") or []
        tags_str = ", ".join(tags_list)

        description = f"Codeforces Problem {source_id}: {name}. Rating: {rating if rating else 'Unrated'}. Topics: {tags_str}."

        return {
            "source": self.source_code,
            "sourceId": source_id,
            "title": f"{name} ({source_id})",
            "description": description,
            "url": url,
            "difficulty": difficulty,
            "rating": rating,
            "tags": tags_str,
            "skills": tags_str,
            "isActive": True
        }
