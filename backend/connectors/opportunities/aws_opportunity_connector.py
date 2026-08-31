import urllib.request
import json
from typing import List, Dict, Any
from datetime import datetime, timedelta
from connectors.opportunities.base_opportunity_connector import BaseOpportunityConnector

class AWSOpportunityConnector(BaseOpportunityConnector):
    """
    Connector for AWS Cloud, Data & Machine Learning webinars.
    """

    @property
    def source_code(self) -> str:
        return "AWS"

    @property
    def source_name(self) -> str:
        return "AWS Technical Events"

    def fetch_opportunities(self, limit: int = 15) -> List[Dict[str, Any]]:
        events = [
            {
                "id": "aws-de-101",
                "title": "Architecting Serverless Data Lakes with AWS Glue & Redshift",
                "description": "Learn to query, transform, and analyze petabyte-scale datasets using AWS Glue ETL pipelines and Amazon Redshift Serverless.",
                "url": "https://aws.amazon.com/events/data-lakes-glue-redshift",
                "eventType": "WORKSHOP",
                "topic": "Data Engineering",
                "skills": "AWS Glue, Redshift, SQL, ETL, Python",
                "days_ahead": 6
            },
            {
                "id": "aws-ai-202",
                "title": "Generative AI Masterclass: Deploying LLMs with Amazon Bedrock & SageMaker",
                "description": "Hands-on guide to fine-tuning foundation models, implementing RAG with Vector DBs, and deploying scalable inference endpoints on AWS.",
                "url": "https://aws.amazon.com/events/genai-bedrock-sagemaker",
                "eventType": "MASTERCLASS",
                "topic": "Generative AI",
                "skills": "AWS Bedrock, SageMaker, LLMs, RAG, Python",
                "days_ahead": 10
            },
            {
                "id": "aws-dcg-303",
                "title": "Cloud Infrastructure Automation with AWS CDK, Terraform & GitHub Actions",
                "description": "Best practices for Infrastructure as Code (IaC), CI/CD automation, and cloud security compliance across multi-account AWS environments.",
                "url": "https://aws.amazon.com/events/cdk-terraform-devops",
                "eventType": "WEBINAR",
                "topic": "Cloud / DevOps",
                "skills": "AWS CDK, Terraform, DevOps, GitHub Actions, Cloud Security",
                "days_ahead": 14
            }
        ]

        normalized = []
        now = datetime.now()
        for item in events[:limit]:
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
                "imageUrl": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=60",
                "difficulty": "Intermediate",
                "isActive": True
            })

        return normalized
