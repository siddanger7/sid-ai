from __future__ import annotations
import os
import logging

logger = logging.getLogger("SID.AI")

CHROMA_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
CHUNK_SIZE = 500
CHUNK_OVERLAP = 100

_client = None
_collection = None
_rag_disabled = False


def _init_rag():
    global _client, _collection, _rag_disabled
    if _rag_disabled:
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
        logger.warning("ChromaDB unavailable (RAG disabled): %s", e)
        _rag_disabled = True


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
    global _rag_disabled
    if _rag_disabled or _collection is None:
        logger.warning("RAG disabled — skipping index of '%s'", file_name)
        return 0
    chunks = chunk_text(content)
    ids: list[str] = []
    metadatas: list[dict] = []
    documents: list[str] = []
    for i, chunk in enumerate(chunks):
        ids.append(f"{file_name}::{i}")
        metadatas.append({"file": file_name, "chunk": i})
        documents.append(chunk)
    try:
        _collection.add(ids=ids, metadatas=metadatas, documents=documents)
        logger.info("Indexed %d chunks from '%s'", len(chunks), file_name)
    except Exception as e:
        logger.warning("Failed to index '%s': %s", file_name, e)
        return 0
    return len(chunks)


def search_documents(query: str, top_k: int = 3) -> list[dict]:
    _init_rag()
    global _rag_disabled
    if _rag_disabled or _collection is None:
        return []
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
        logger.warning("Chroma query failed: %s", e)
        return []


def build_rag_context(query: str) -> str:
    results = search_documents(query)
    if not results:
        return ""
    parts = []
    for r in results:
        parts.append(f"[From: {r['file']}]\n{r['content']}")
    return "Relevant context from uploaded documents:\n\n" + "\n\n---\n\n".join(parts)
