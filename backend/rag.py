from __future__ import annotations
import os
import logging

logger = logging.getLogger("SID.AI")

CHROMA_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
CHUNK_SIZE = 500
CHUNK_OVERLAP = 100

_client = None
_collection = None
_using_chroma = True

# In-memory fallback store (used when ChromaDB is unavailable)
_fallback_docs: list[dict] = []  # [{file, text}]


def _init_rag():
    global _client, _collection, _using_chroma
    if not _using_chroma:
        return
    try:
        import chromadb
        from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
        _client = chromadb.PersistentClient(path=CHROMA_DIR)
        ef = DefaultEmbeddingFunction()
        _collection = _client.get_or_create_collection(
            name="documents",
            embedding_function=ef,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info("ChromaDB ready at %s", CHROMA_DIR)
    except Exception as e:
        logger.info("ChromaDB unavailable — using in-memory fallback RAG: %s", e)
        _using_chroma = False


def chunk_text(text: str) -> list[str]:
    paragraphs = text.split("\n\n")
    chunks: list[str] = []
    buffer = ""
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        if len(buffer) + len(para) < CHUNK_SIZE:
            buffer += para + "\n\n"
        else:
            if buffer:
                chunks.append(buffer.strip())
            buffer = para + "\n\n"
    if buffer.strip():
        chunks.append(buffer.strip())
    return chunks if chunks else [text[:CHUNK_SIZE]]


def index_document(file_name: str, content: str) -> int:
    _init_rag()
    chunks = chunk_text(content)

    if _using_chroma and _collection is not None:
        try:
            ids: list[str] = []
            metadatas: list[dict] = []
            documents: list[str] = []
            for i, chunk in enumerate(chunks):
                ids.append(f"{file_name}::{i}")
                metadatas.append({"file": file_name, "chunk": i})
                documents.append(chunk)
            _collection.add(ids=ids, metadatas=metadatas, documents=documents)
            logger.info("Indexed %d chunks from '%s' (ChromaDB)", len(chunks), file_name)
        except Exception as e:
            logger.warning("ChromaDB index failed, falling back: %s", e)
            global _using_chroma
            _using_chroma = False
            _store_fallback(file_name, chunks)
            return len(chunks)
        return len(chunks)

    _store_fallback(file_name, chunks)
    return len(chunks)


def _store_fallback(file_name: str, chunks: list[str]) -> None:
    for chunk in chunks:
        _fallback_docs.append({"file": file_name, "text": chunk})
    logger.info("Indexed %d chunks from '%s' (in-memory)", len(chunks), file_name)


def search_documents(query: str, top_k: int = 3) -> list[dict]:
    _init_rag()

    if _using_chroma and _collection is not None:
        try:
            results = _collection.query(query_texts=[query], n_results=top_k)
            docs = results.get("documents", [[]])[0]
            metas = results.get("metadatas", [[]])[0]
            distances = results.get("distances", [[]])[0]
            return [
                {"content": d, "file": m.get("file", ""), "score": round(1 - s, 3)}
                for d, m, s in zip(docs, metas, distances)
            ]
        except Exception as e:
            logger.warning("Chroma query failed, using fallback: %s", e)

    return _search_fallback(query, top_k)


def _search_fallback(query: str, top_k: int = 3) -> list[dict]:
    if not _fallback_docs:
        return []
    query_lower = query.lower()
    query_words = [w for w in query_lower.split() if len(w) > 2]
    if not query_words:
        return []

    scored: list[tuple[float, dict]] = []
    for doc in _fallback_docs:
        text_lower = doc["text"].lower()
        score = sum(1 for w in query_words if w in text_lower) / max(len(query_words), 1)
        if score > 0:
            scored.append((score, doc))

    scored.sort(key=lambda x: -x[0])
    return [
        {"content": d["text"], "file": d["file"], "score": round(s, 3)}
        for s, d in scored[:top_k]
    ]


def build_rag_context(query: str) -> str:
    results = search_documents(query)
    if not results:
        return ""
    parts = []
    for r in results:
        parts.append(f"[From: {r['file']}]\n{r['content']}")
    return "Relevant context from uploaded documents:\n\n" + "\n\n---\n\n".join(parts)
