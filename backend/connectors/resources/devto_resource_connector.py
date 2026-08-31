import urllib.request
import json
from typing import List, Dict, Any
from connectors.resources.base_resource_connector import BaseResourceConnector

class DevToResourceConnector(BaseResourceConnector):
    """
    Connector for Dev.to REST API public articles search.
    Verified Endpoint: https://dev.to/api/articles?tag={tag}&per_page={limit}
    """

    @property
    def source_code(self) -> str:
        return "DEVTO"

    @property
    def source_name(self) -> str:
        return "Dev.to"

    def fetch_resources(self, limit: int = 20) -> List[Dict[str, Any]]:
        tags = [
            ("dataengineering", "Data Engineering"),
            ("machinelearning", "Cognitive Technology"),
            ("devops", "DCG")
        ]
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json"
        }
        
        normalized_results = []
        per_tag_limit = max(5, limit // len(tags))

        for tag, default_cat in tags:
            url = f"https://dev.to/api/articles?tag={tag}&per_page={per_tag_limit}"
            req = urllib.request.Request(url, headers=headers)
            
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    if resp.status == 200:
                        articles = json.loads(resp.read().decode("utf-8"))
                        if isinstance(articles, list):
                            for item in articles:
                                norm = self._normalize_article(item, default_cat)
                                if norm:
                                    normalized_results.append(norm)
            except Exception as e:
                print(f"Dev.to Connector error fetching tag '{tag}': {e}")
                continue

        return normalized_results

    def _normalize_article(self, article: Dict[str, Any], default_category: str) -> Dict[str, Any]:
        article_id = str(article.get("id") or "")
        if not article_id:
            return None

        title = article.get("title") or "Technical Article"
        description = article.get("description") or title
        url = article.get("url") or f"https://dev.to/p/{article_id}"
        
        user_info = article.get("user") or {}
        author = user_info.get("name") or user_info.get("username") or "Dev.to Author"
        
        thumbnail = article.get("cover_image") or article.get("social_image") or user_info.get("profile_image") or "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop&q=60"
        
        tags_list = article.get("tag_list") or []
        skills_str = ", ".join(tags_list) if isinstance(tags_list, list) else str(tags_list)
        
        reactions = article.get("public_reactions_count", 0)
        difficulty = "Advanced" if reactions > 200 else "Intermediate" if reactions > 50 else "Beginner"

        return {
            "source": self.source_code,
            "sourceId": article_id,
            "title": title,
            "description": description,
            "url": url,
            "resourceType": "article",
            "category": default_category,
            "skills": skills_str or "Programming, Web",
            "difficulty": difficulty,
            "thumbnail": thumbnail,
            "author": author,
            "publishedAt": article.get("published_at") or "",
            "isActive": True
        }
