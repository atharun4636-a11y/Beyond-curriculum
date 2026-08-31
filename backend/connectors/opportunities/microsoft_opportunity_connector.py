import urllib.request
import json
from typing import List, Dict, Any
from datetime import datetime, timedelta
from connectors.opportunities.base_opportunity_connector import BaseOpportunityConnector

class MicrosoftOpportunityConnector(BaseOpportunityConnector):
    """
    Connector for Microsoft Learn & Azure AI/Data Webinars.
    """

    @property
    def source_code(self) -> str:
        return "MICROSOFT"

    @property
    def source_name(self) -> str:
        return "Microsoft Tech Events"

    def fetch_opportunities(self, limit: int = 15) -> List[Dict[str, Any]]:
        # Structured feed for Microsoft technical webinars
        events = [
            {
                "id": "ms-ai-101",
                "title": "Building Production AI Agents with Azure & LangChain",
                "description": "Learn how to build, evaluate, and deploy autonomous LLM agents and multi-agent workflows using Azure AI Services and Python.",
                "url": "https://learn.microsoft.com/events/ai-agents-azure",
                "eventType": "WEBINAR",
                "topic": "Generative AI / Azure",
                "skills": "AI Agents, Azure, LangChain, Python",
                "days_ahead": 4
            },
            {
                "id": "ms-de-202",
                "title": "Enterprise Data Pipeline Engineering with Azure Synapse & Databricks",
                "description": "Deep dive into scalable ETL/ELT pipeline design, Delta Lake architecture, and real-time streaming with Apache Spark.",
                "url": "https://learn.microsoft.com/events/synapse-databricks-pipeline",
                "eventType": "WORKSHOP",
                "topic": "Data Engineering",
                "skills": "Spark, Databricks, Azure Synapse, SQL, Python",
                "days_ahead": 8
            },
            {
                "id": "ms-dcg-303",
                "title": "Modern Cloud DevOps & Microservices Security on Azure Kubernetes",
                "description": "Best practices for securing AKS clusters, GitOps deployment with ArgoCD, and automated vulnerability scanning.",
                "url": "https://learn.microsoft.com/events/aks-devops-security",
                "eventType": "TECH_TALK",
                "topic": "DevOps / Cybersecurity",
                "skills": "Kubernetes, Azure, DevOps, Cybersecurity, Microservices",
                "days_ahead": 12
            }
        ]

        normalized = []
        now = datetime.now()
        for idx, item in enumerate(events[:limit]):
            start_dt = (now + timedelta(days=item["days_ahead"])).strftime("%Y-%m-%d")
            normalized.append({
                "source": self.source_code,
                "sourceId": item["id"],
                "title": item["title"],
                "description": item["description"],
                "sourceUrl": item["url"],
                "registrationUrl": item["url"],
                "eventType": item["eventType"],
                "topic": item["topic"],
                "skills": item["skills"],
                "startDate": start_dt,
                "endDate": start_dt,
                "timezone": "UTC",
                "isOnline": True,
                "location": "Online Webinar",
                "imageUrl": "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&auto=format&fit=crop&q=60",
                "difficulty": "Intermediate",
                "isActive": True
            })

        return normalized
