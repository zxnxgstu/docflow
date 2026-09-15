from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import Document, DocumentStatus, ExtractedField, ExtractedTable
from app.processing.pdf.extractor import extract_pdf


settings = get_settings()


def create_document(db: Session, upload: UploadFile, content: bytes) -> Document:
    stored_name = f"{uuid4()}.pdf"
    path = settings.uploads_dir / stored_name
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    document = Document(original_filename=upload.filename or "document.pdf", stored_filename=stored_name, file_size=len(content))
    db.add(document)
    db.commit()
    db.refresh(document)
    process_document(db, document, path)
    return document


def process_document(db: Session, document: Document, path: Path) -> None:
    try:
        parsed = extract_pdf(path)
        document.page_count = parsed.page_count
        for item in parsed.fields:
            document.fields.append(ExtractedField(
                page_number=item.page, field_name=item.name, field_value=item.value,
                field_type=item.kind, confidence=item.confidence,
            ))
        for item in parsed.tables:
            document.tables.append(ExtractedTable(page_number=item.page, table_index=item.index, data_json=item.rows))
        document.status = DocumentStatus.completed.value
        document.processed_at = datetime.now(timezone.utc)
    except Exception as exc:
        document.status = DocumentStatus.failed.value
        document.error_message = str(exc)
    db.commit()
    db.refresh(document)

