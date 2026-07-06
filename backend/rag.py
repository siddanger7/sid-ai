from __future__ import annotations
import os
import logging

import chromadb
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

logger = logging.getLogger("SID.AI")

CHROMA_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
CHUNK_SIZE = 500
CHUNK_OVERLAP = 100

_client: chromadb.PersistentClient | None = None
_collection: chromadb.Collection | None = None


def get_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=CHROMA_DIR)
    return _client


def get_collection() -> chromadb.Collection:
    global _collection
    if _collection is None:
        ef = DefaultEmbeddingFunction()
        client = get_client()
        _collection = client.get_or_create_collection(
            name="documents",
            embedding_function=ef,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


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
    chunks = chunk_text(content)
    collection = get_collection()
    ids: list[str] = []
    metadatas: list[dict] = []
    documents: list[str] = []
    for i, chunk in enumerate(chunks):
        ids.append(f"{file_name}::{i}")
        metadatas.append({"file": file_name, "chunk": i})
        documents.append(chunk)
    collection.add(ids=ids, metadatas=metadatas, documents=documents)
    logger.info("Indexed %d chunks from '%s'", len(chunks), file_name)
    return len(chunks)


def search_documents(query: str, top_k: int = 3) -> list[dict]:
    try:
        collection = get_collection()
        results = collection.query(query_texts=[query], n_results=top_k)
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
