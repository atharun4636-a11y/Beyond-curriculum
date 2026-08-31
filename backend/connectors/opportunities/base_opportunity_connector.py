from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseOpportunityConnector(ABC):
    """
    Abstract base class for professional opportunity & webinar connectors (Microsoft, GitHub, AWS, Dev.to, etc.)
    """

    @property
    @abstractmethod
    def source_code(self) -> str:
        """Return source code identifier (e.g. MICROSOFT, GITHUB, DEVTO)"""
        pass

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Return human-readable source name"""
        pass

    @abstractmethod
    def fetch_opportunities(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Fetch professional webinars, workshops & tech events from external API/feed and return normalized dicts.
        """
        pass
