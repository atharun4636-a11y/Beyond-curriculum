from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseResourceConnector(ABC):
    """
    Abstract base class for learning resource connectors (GitHub, Dev.to, etc.)
    """

    @property
    @abstractmethod
    def source_code(self) -> str:
        """Return source code identifier (e.g. GITHUB, DEVTO)"""
        pass

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Return human-readable source name"""
        pass

    @abstractmethod
    def fetch_resources(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Fetch learning resources from external source API and return normalized dict objects.
        """
        pass
