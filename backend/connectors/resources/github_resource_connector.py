import urllib.request
import json
from typing import List, Dict, Any
from connectors.resources.base_resource_connector import BaseResourceConnector

class GitHubResourceConnector(BaseResourceConnector):
    """
    Connector for GitHub REST API public repository search.
    Endpoint: https://api.github.com/search/repositories?q={query}&sort=stars&order=desc
    """

    @property
    def source_code(self) -> str:
        return "GITHUB"

    @property
    def source_name(self) -> str:
        return "GitHub"

    def fetch_resources(self, limit: int = 20) -> List[Dict[str, Any]]:
        queries = [
            ("data engineering etl spark airflow", "Data Engineering"),
            ("machine learning deep learning llm", "Cognitive Technology"),
            ("cloud devops kubernetes cybersecurity", "DCG")
        ]
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/vnd.github.v3+json"
        }
        
        normalized_results = []
        per_query_limit = max(5, limit // len(queries))

        for query, default_cat in queries:
            encoded_q = urllib.parse.quote(query)
            url = f"https://api.github.com/search/repositories?q={encoded_q}&sort=stars&order=desc&per_page={per_query_limit}"
            req = urllib.request.Request(url, headers=headers)
            
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode("utf-8"))
                        items = data.get("items", [])
                        for item in items:
                            norm = self._normalize_repo(item, default_cat)
                            if norm:
                                normalized_results.append(norm)
            except Exception as e:
                print(f"GitHub Connector error fetching '{query}': {e}")
                continue

        return normalized_results

    def _normalize_repo(self, repo: Dict[str, Any], default_category: str) -> Dict[str, Any]:
        repo_id = str(repo.get("id") or "")
        if not repo_id:
            return None

        full_name = repo.get("full_name") or repo.get("name") or "GitHub Repo"
        description = repo.get("description") or f"Popular GitHub repository: {full_name}"
        html_url = repo.get("html_url") or f"https://github.com/{full_name}"
        owner_name = repo.get("owner", {}).get("login") if isinstance(repo.get("owner"), dict) else "GitHub"
        owner_avatar = repo.get("owner", {}).get("avatar_url") if isinstance(repo.get("owner"), dict) else ""
        
        topics = repo.get("topics") or []
        skills_str = ", ".join(topics[:6]) if topics else repo.get("language") or "Software Development"

        stars = repo.get("stargazers_count", 0)
        difficulty = "Advanced" if stars > 10000 else "Intermediate" if stars > 2000 else "Beginner"

        return {
            "source": self.source_code,
            "sourceId": repo_id,
            "title": full_name,
            "description": f"{description} (⭐ {stars} stars)",
            "url": html_url,
            "resourceType": "repository",
            "category": default_category,
            "skills": skills_str,
            "difficulty": difficulty,
            "thumbnail": owner_avatar or "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&auto=format&fit=crop&q=60",
            "author": owner_name,
            "publishedAt": repo.get("created_at") or "",
            "isActive": True
        }
