import urllib.request
import json
from typing import List, Dict, Any
from connectors.coding.base_coding_connector import BaseCodingConnector

class HackerRankConnector(BaseCodingConnector):
    """
    Connector for HackerRank coding challenges (Python & SQL).
    """

    @property
    def source_code(self) -> str:
        return "HACKERRANK"

    @property
    def source_name(self) -> str:
        return "HackerRank"

    def fetch_problems(self, limit: int = 40) -> List[Dict[str, Any]]:
        # Structured curation of real HackerRank Python & SQL challenges
        hackerrank_dataset = [
            # SQL Challenges
            {"id": "revising-the-select-query-1", "title": "Revising the Select Query I", "slug": "revising-the-select-query-1", "difficulty": "Easy", "language": "SQL", "category": "Database"},
            {"id": "select-all-sql", "title": "Select All", "slug": "select-all-sql", "difficulty": "Easy", "language": "SQL", "category": "Database"},
            {"id": "select-by-id", "title": "Select By ID", "slug": "select-by-id", "difficulty": "Easy", "language": "SQL", "category": "Database"},
            {"id": "weather-observation-station-1", "title": "Weather Observation Station 1", "slug": "weather-observation-station-1", "difficulty": "Easy", "language": "SQL", "category": "Database"},
            {"id": "weather-observation-station-5", "title": "Weather Observation Station 5", "slug": "weather-observation-station-5", "difficulty": "Medium", "language": "SQL", "category": "Database"},
            {"id": "the-pads", "title": "The PADS", "slug": "the-pads", "difficulty": "Medium", "language": "SQL", "category": "Database"},
            {"id": "occupations", "title": "Occupations", "slug": "occupations", "difficulty": "Medium", "language": "SQL", "category": "Database"},
            {"id": "binary-search-tree-1", "title": "Binary Tree Nodes", "slug": "binary-search-tree-1", "difficulty": "Medium", "language": "SQL", "category": "Database"},
            {"id": "15-days-of-learning-sql", "title": "15 Days of Learning SQL", "slug": "15-days-of-learning-sql", "difficulty": "Hard", "language": "SQL", "category": "Database"},
            {"id": "interviews", "title": "Interviews", "slug": "interviews", "difficulty": "Hard", "language": "SQL", "category": "Database"},

            # Python Challenges
            {"id": "py-hello-world", "title": "Say Hello, World! With Python", "slug": "py-hello-world", "difficulty": "Easy", "language": "Python", "category": "Python"},
            {"id": "python-if-else", "title": "Python If-Else", "slug": "python-if-else", "difficulty": "Easy", "language": "Python", "category": "Python"},
            {"id": "python-arithmetic-operators", "title": "Arithmetic Operators", "slug": "python-arithmetic-operators", "difficulty": "Easy", "language": "Python", "category": "Python"},
            {"id": "python-division", "title": "Python: Division", "slug": "python-division", "difficulty": "Easy", "language": "Python", "category": "Python"},
            {"id": "python-loops", "title": "Loops", "slug": "python-loops", "difficulty": "Easy", "language": "Python", "category": "Python"},
            {"id": "write-a-function", "title": "Write a function", "slug": "write-a-function", "difficulty": "Medium", "language": "Python", "category": "Python"},
            {"id": "python-print", "title": "Print Function", "slug": "python-print", "difficulty": "Easy", "language": "Python", "category": "Python"},
            {"id": "find-second-maximum-number-in-a-list", "title": "Find the Runner-Up Score!", "slug": "find-second-maximum-number-in-a-list", "difficulty": "Easy", "language": "Python", "category": "Python"},
            {"id": "nested-list", "title": "Nested Lists", "slug": "nested-list", "difficulty": "Medium", "language": "Python", "category": "Python"},
            {"id": "finding-the-percentage", "title": "Finding the percentage", "slug": "finding-the-percentage", "difficulty": "Medium", "language": "Python", "category": "Python"},
            {"id": "python-string-formatting", "title": "String Formatting", "slug": "python-string-formatting", "difficulty": "Medium", "language": "Python", "category": "Python"},
            {"id": "matrix-script", "title": "Matrix Script", "slug": "matrix-script", "difficulty": "Hard", "language": "Python", "category": "Python"}
        ]

        normalized = []
        for item in hackerrank_dataset[:limit]:
            normalized.append({
                "source": self.source_code,
                "sourceId": f"hackerrank-{item['id']}",
                "title": item["title"],
                "slug": item["slug"],
                "url": f"https://www.hackerrank.com/challenges/{item['slug']}/problem",
                "language": item["language"],
                "difficulty": item["difficulty"],
                "category": item["category"],
                "rating": 800 if item["difficulty"] == "Easy" else 1200 if item["difficulty"] == "Medium" else 1600,
                "tags": f"{item['language']}, {item['category']}, HackerRank",
                "isActive": True
            })

        return normalized
