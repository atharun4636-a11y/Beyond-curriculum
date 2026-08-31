import urllib.request
import json
from typing import List, Dict, Any
from connectors.coding.base_coding_connector import BaseCodingConnector

class LeetCodeConnector(BaseCodingConnector):
    """
    Connector for LeetCode coding problems (Python & SQL).
    Verified Endpoint: https://leetcode.com/api/problems/all/
    """

    @property
    def source_code(self) -> str:
        return "LEETCODE"

    @property
    def source_name(self) -> str:
        return "LeetCode"

    def fetch_problems(self, limit: int = 50) -> List[Dict[str, Any]]:
        # Structured curation of top real LeetCode Python & SQL problems
        leetcode_dataset = [
            # SQL Problems
            {"id": 175, "title": "Combine Two Tables", "slug": "combine-two-tables", "difficulty": "Easy", "language": "SQL", "category": "Database"},
            {"id": 176, "title": "Second Highest Salary", "slug": "second-highest-salary", "difficulty": "Medium", "language": "SQL", "category": "Database"},
            {"id": 177, "title": "Nth Highest Salary", "slug": "nth-highest-salary", "difficulty": "Medium", "language": "SQL", "category": "Database"},
            {"id": 178, "title": "Rank Scores", "slug": "rank-scores", "difficulty": "Medium", "language": "SQL", "category": "Database"},
            {"id": 180, "title": "Consecutive Numbers", "slug": "consecutive-numbers", "difficulty": "Medium", "language": "SQL", "category": "Database"},
            {"id": 181, "title": "Employees Earning More Than Their Managers", "slug": "employees-earning-more-than-their-managers", "difficulty": "Easy", "language": "SQL", "category": "Database"},
            {"id": 182, "title": "Duplicate Emails", "slug": "duplicate-emails", "difficulty": "Easy", "language": "SQL", "category": "Database"},
            {"id": 183, "title": "Customers Who Never Order", "slug": "customers-who-never-order", "difficulty": "Easy", "language": "SQL", "category": "Database"},
            {"id": 184, "title": "Department Highest Salary", "slug": "department-highest-salary", "difficulty": "Medium", "language": "SQL", "category": "Database"},
            {"id": 185, "title": "Department Top Three Salaries", "slug": "department-top-three-salaries", "difficulty": "Hard", "language": "SQL", "category": "Database"},
            {"id": 262, "title": "Trips and Users", "slug": "trips-and-users", "difficulty": "Hard", "language": "SQL", "category": "Database"},
            {"id": 595, "title": "Big Countries", "slug": "big-countries", "difficulty": "Easy", "language": "SQL", "category": "Database"},
            {"id": 601, "title": "Human Traffic of Stadium", "slug": "human-traffic-of-stadium", "difficulty": "Hard", "language": "SQL", "category": "Database"},
            {"id": 620, "title": "Not Boring Movies", "slug": "not-boring-movies", "difficulty": "Easy", "language": "SQL", "category": "Database"},
            {"id": 626, "title": "Exchange Seats", "slug": "exchange-seats", "difficulty": "Medium", "language": "SQL", "category": "Database"},

            # Python Algorithm Problems
            {"id": 1, "title": "Two Sum", "slug": "two-sum", "difficulty": "Easy", "language": "Python", "category": "Algorithms"},
            {"id": 2, "title": "Add Two Numbers", "slug": "add-two-numbers", "difficulty": "Medium", "language": "Python", "category": "Algorithms"},
            {"id": 3, "title": "Longest Substring Without Repeating Characters", "slug": "longest-substring-without-repeating-characters", "difficulty": "Medium", "language": "Python", "category": "Algorithms"},
            {"id": 4, "title": "Median of Two Sorted Arrays", "slug": "median-of-two-sorted-arrays", "difficulty": "Hard", "language": "Python", "category": "Algorithms"},
            {"id": 5, "title": "Longest Palindromic Substring", "slug": "longest-palindromic-substring", "difficulty": "Medium", "language": "Python", "category": "Algorithms"},
            {"id": 15, "title": "3Sum", "slug": "3sum", "difficulty": "Medium", "language": "Python", "category": "Algorithms"},
            {"id": 20, "title": "Valid Parentheses", "slug": "valid-parentheses", "difficulty": "Easy", "language": "Python", "category": "Algorithms"},
            {"id": 21, "title": "Merge Two Sorted Lists", "slug": "merge-two-sorted-lists", "difficulty": "Easy", "language": "Python", "category": "Algorithms"},
            {"id": 23, "title": "Merge k Sorted Lists", "slug": "merge-k-sorted-lists", "difficulty": "Hard", "language": "Python", "category": "Algorithms"},
            {"id": 42, "title": "Trapping Rain Water", "slug": "trapping-rain-water", "difficulty": "Hard", "language": "Python", "category": "Algorithms"},
            {"id": 53, "title": "Maximum Subarray", "slug": "maximum-subarray", "difficulty": "Medium", "language": "Python", "category": "Algorithms"},
            {"id": 70, "title": "Climbing Stairs", "slug": "climbing-stairs", "difficulty": "Easy", "language": "Python", "category": "Algorithms"},
            {"id": 121, "title": "Best Time to Buy and Sell Stock", "slug": "best-time-to-buy-and-sell-stock", "difficulty": "Easy", "language": "Python", "category": "Algorithms"},
            {"id": 206, "title": "Reverse Linked List", "slug": "reverse-linked-list", "difficulty": "Easy", "language": "Python", "category": "Algorithms"},
            {"id": 295, "title": "Find Median from Data Stream", "slug": "find-median-from-data-stream", "difficulty": "Hard", "language": "Python", "category": "Algorithms"}
        ]

        # Attempt public API fetch to enrich or complement
        url = "https://leetcode.com/api/problems/all/"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    stat_pairs = data.get("stat_status_pairs", [])
                    fetched = []
                    for pair in stat_pairs[:limit]:
                        stat = pair.get("stat", {})
                        title = stat.get("question__title")
                        slug = stat.get("question__title_slug")
                        q_id = stat.get("question_id")
                        level = pair.get("difficulty", {}).get("level", 1)
                        diff_name = "Easy" if level == 1 else "Medium" if level == 2 else "Hard"

                        if title and slug and q_id:
                            is_sql = "sql" in slug or "select" in slug or "table" in slug or "salary" in slug or "employee" in slug
                            lang = "SQL" if is_sql else "Python"
                            cat = "Database" if is_sql else "Algorithms"

                            fetched.append({
                                "source": self.source_code,
                                "sourceId": f"leetcode-{q_id}",
                                "title": title,
                                "slug": slug,
                                "url": f"https://leetcode.com/problems/{slug}/",
                                "language": lang,
                                "difficulty": diff_name,
                                "category": cat,
                                "rating": 800 if diff_name == "Easy" else 1200 if diff_name == "Medium" else 1600,
                                "tags": f"{lang}, {cat}, LeetCode",
                                "isActive": True
                            })
                    if fetched:
                        return fetched[:limit]
        except Exception as e:
            print(f"LeetCode API live fetch fallback to dataset: {e}")

        # Return structured dataset
        normalized = []
        for item in leetcode_dataset[:limit]:
            normalized.append({
                "source": self.source_code,
                "sourceId": f"leetcode-{item['id']}",
                "title": item["title"],
                "slug": item["slug"],
                "url": f"https://leetcode.com/problems/{item['slug']}/",
                "language": item["language"],
                "difficulty": item["difficulty"],
                "category": item["category"],
                "rating": 800 if item["difficulty"] == "Easy" else 1200 if item["difficulty"] == "Medium" else 1600,
                "tags": f"{item['language']}, {item['category']}, LeetCode",
                "isActive": True
            })

        return normalized
