from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseCodingConnector(ABC):
    """
    Abstract base class for coding practice problem connectors (Codeforces, etc.)
    """

    @property
    @abstractmethod
    def source_code(self) -> str:
        """Return source code identifier (e.g. CODEFORCES)"""
        pass

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Return human-readable source name"""
        pass

    @abstractmethod
    def fetch_problems(self, limit: int = 30) -> List[Dict[str, Any]]:
        """
        Fetch coding problems from external API and return normalized dict objects.
        """
        pass
