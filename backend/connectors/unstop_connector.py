import urllib.request
import json
from typing import List, Dict, Any
from datetime import datetime
from connectors.base_connector import BaseConnector

class UnstopConnector(BaseConnector):
    """
    Connector for Unstop hackathons public API endpoint.
    Verified endpoint: https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&per_page={limit}&oppstatus=open
    """
    
    @property
    def source_code(self) -> str:
        return "UNSTOP"

    @property
    def source_name(self) -> str:
        return "Unstop"

    def fetch_opportunities(self, limit: int = 15) -> List[Dict[str, Any]]:
        url = f"https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&per_page={limit}&oppstatus=open"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json"
        }
        
        req = urllib.request.Request(url, headers=headers)
        
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                if response.status != 200:
                    raise Exception(f"Unstop API HTTP Error status code {response.status}")
                raw_data = json.loads(response.read().decode("utf-8"))
        except Exception as e:
            print(f"Error fetching Unstop opportunities: {e}")
            return []

        raw_list = raw_data.get("data", {}).get("data", [])
        normalized_results = []
        
        for item in raw_list:
            norm = self._normalize_item(item)
            if norm:
                normalized_results.append(norm)

        return normalized_results

    def _normalize_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        source_id = str(item.get("id") or "")
        if not source_id:
            return None

        title = item.get("title") or "Unstop Hackathon"
        
        # Extract Organization
        org = item.get("organisation")
        if isinstance(org, dict):
            organizer = org.get("name") or "Unstop Partner"
        elif isinstance(org, str) and org.strip():
            organizer = org.strip()
        else:
            organizer = "Unstop Community"

        # Mode
        subtype = str(item.get("subtype") or "").lower()
        opp_type = str(item.get("type") or "").lower()
        if "online" in subtype or "online" in opp_type:
            mode = "Online"
        elif "offline" in subtype or "offline" in opp_type:
            mode = "Offline"
        else:
            mode = "Online"

        # Registration & SEO Links
        seo_url = item.get("seo_url") or item.get("public_url") or f"https://unstop.com/p/{source_id}"
        if seo_url and not seo_url.startswith("http"):
            seo_url = f"https://unstop.com{seo_url}"

        # Image Poster
        poster = item.get("logoUrl2") or item.get("thumb") or "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&auto=format&fit=crop&q=60"

        # Dates
        reg_reqs = item.get("regnRequirements") or {}
        raw_end_date = item.get("end_date") or reg_reqs.get("end_regn_dt") or ""
        last_date = ""
        if raw_end_date:
            try:
                last_date = raw_end_date.split("T")[0]
            except Exception:
                last_date = str(raw_end_date)[:10]

        event_date = last_date or datetime.now().strftime("%Y-%m-%d")

        # Skills
        req_skills = item.get("required_skills") or []
        skills_list = []
        if isinstance(req_skills, list):
            for s in req_skills:
                if isinstance(s, dict) and s.get("skill_name"):
                    skills_list.append(s["skill_name"])
                elif isinstance(s, str):
                    skills_list.append(s)
        skills = ", ".join(skills_list) if skills_list else "Coding, Problem Solving"

        # Team Size
        min_team = reg_reqs.get("min_team_size") or 1
        max_team = reg_reqs.get("max_team_size") or 4
        team_size = f"{min_team}-{max_team}"

        # Category
        category = item.get("subtype") or "Hackathon"

        # Description / Statement
        statement = item.get("seo_description") or f"Participate in {title} organized by {organizer} on Unstop."
        description = f"{statement} Required skills: {skills}."

        return {
            "source": self.source_code,
            "sourceId": source_id,
            "sourceUrl": seo_url,
            "name": title,
            "statement": statement,
            "organizer": organizer,
            "mode": mode,
            "location": reg_reqs.get("work_location_type") or "",
            "regLink": seo_url,
            "lastDate": last_date,
            "eventDate": event_date,
            "poster": poster,
            "description": description,
            "category": category,
            "skills": skills,
            "eligibility": "All Eligible Students & Employees",
            "teamSize": team_size,
            "isActive": True
        }
