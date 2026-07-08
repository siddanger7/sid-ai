import os
import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel

from dependencies import get_current_user
from rag import index_document

logger = logging.getLogger("SID.AI")

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".csv"}

router = APIRouter(prefix="/upload", tags=["upload"])


class UploadResponse(BaseModel):
    id: str
    file_name: str
    file_size: int
    content_type: str
    chunks_indexed: int


@router.post("", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 20 MB)")

    file_id = uuid.uuid4().hex
    safe_name = f"{file_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(file_path, "wb") as f:
        f.write(content)

    text = extract_text(file.filename or safe_name, content)
    chunks = 0
    if text.strip():
        chunks = index_document(file.filename or safe_name, text)
    else:
        logger.info("No extractable text in '%s'", file.filename)

    logger.info("Uploaded '%s' (%d bytes, %d chunks)", file.filename, len(content), chunks)

    return UploadResponse(
        id=file_id,
        file_name=file.filename or safe_name,
        file_size=len(content),
        content_type=file.content_type or "",
        chunks_indexed=chunks,
    )


def extract_text(filename: str, content: bytes) -> str:
    ext = os.path.splitext(filename)[1].lower()
    if ext == ".pdf":
        return extract_pdf_text(content)
    return content.decode("utf-8", errors="replace")


def extract_pdf_text(content: bytes) -> str:
    try:
        from io import BytesIO
        from pdfminer.high_level import extract_text as pdfminer_extract
        return pdfminer_extract(BytesIO(content)).strip()
    except ImportError:
        logger.warning("PDF extractor not installed, falling back to raw text")
        return content.decode("utf-8", errors="replace")
    except Exception as e:
        logger.exception("PDF extraction failed")
        return f"[Error extracting PDF: {e}]"
