from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseConnector(ABC):
    """
    Abstract base class for all external hackathon source connectors.
    """
    
    @property
    @abstractmethod
    def source_code(self) -> str:
        """Return unique source code identifier (e.g. UNSTOP, DEVPOST)"""
        pass

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Return human-readable source name"""
        pass

    @abstractmethod
    def fetch_opportunities(self, limit: int = 15) -> List[Dict[str, Any]]:
        """
        Fetch opportunities from the external source API/feed and return normalized dict objects.
        """
        pass
