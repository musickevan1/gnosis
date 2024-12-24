"""Service for searching learning topics."""
from typing import List
from src.core.models.search_history import SearchHistory
from src.core.models.database import db

def search_topics(query: str) -> List[SearchHistory]:
    """Search for topics in search history."""
    return SearchHistory.query.filter(
        SearchHistory.topic.ilike(f'%{query}%')
    ).all()
