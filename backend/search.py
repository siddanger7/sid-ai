import os
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from dependencies import get_current_user

logger = logging.getLogger("SID.AI")

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
GOOGLE_CSE_ID = os.environ.get("GOOGLE_CSE_ID", "")

router = APIRouter(prefix="/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str
    num_results: int = 5


class SearchResult(BaseModel):
    title: str
    link: str
    snippet: str


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total_results: int = 0


@router.post("", response_model=SearchResponse)
async def web_search(
    req: SearchRequest,
    user=Depends(get_current_user),
):
    if not GOOGLE_API_KEY or not GOOGLE_CSE_ID:
        raise HTTPException(
            status_code=501,
            detail="Web search is not configured. Set GOOGLE_API_KEY and GOOGLE_CSE_ID environment variables.",
        )

    try:
        import httpx
        params = {
            "key": GOOGLE_API_KEY,
            "cx": GOOGLE_CSE_ID,
            "q": req.query,
            "num": min(req.num_results, 10),
        }
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                "https://www.googleapis.com/customsearch/v1", params=params
            )
            resp.raise_for_status()
            data = resp.json()

        items = data.get("items", [])
        results = [
            SearchResult(
                title=item.get("title", ""),
                link=item.get("link", ""),
                snippet=item.get("snippet", ""),
            )
            for item in items
        ]
        total = data.get("searchInformation", {}).get("totalResults", 0)
        return SearchResponse(results=results, total_results=int(total))

    except ImportError:
        raise HTTPException(status_code=500, detail="httpx is not installed")
    except Exception as e:
        logger.exception("Web search failed")
        raise HTTPException(status_code=502, detail=f"Search API error: {e}")
