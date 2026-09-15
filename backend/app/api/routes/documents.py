from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.db.models import Document, Export, ExtractedField, ExtractedTable
from app.db.session import get_db
from app.processing.excel.builder import build_workbook
from app.schemas import DashboardStats, DocumentRead, ExportCreate, ExportRead, FieldRead, FieldUpdate
from app.services.document_service import create_document


router = APIRouter()
settings = get_settings()


def document_query():
    return select(Document).options(selectinload(Document.fields), selectinload(Document.tables))


@router.get("/stats", response_model=DashboardStats)
def stats(db: Session = Depends(get_db)):
    return DashboardStats(
        documents=db.scalar(select(func.count(Document.id))) or 0,
        pages=db.scalar(select(func.coalesce(func.sum(Document.page_count), 0))) or 0,
        fields=db.scalar(select(func.count(ExtractedField.id))) or 0,
        tables=db.scalar(select(func.count(ExtractedTable.id))) or 0,
        exports=db.scalar(select(func.count(Export.id))) or 0,
    )


@router.post("/documents", response_model=list[DocumentRead], status_code=status.HTTP_201_CREATED)
async def upload_documents(files: list[UploadFile] = File(...), db: Session = Depends(get_db)):
    if not files or len(files) > 20:
        raise HTTPException(400, "Upload between 1 and 20 PDF files")
    created = []
    for upload in files:
        content = await upload.read()
        if not upload.filename or not upload.filename.lower().endswith(".pdf") or not content.startswith(b"%PDF"):
            raise HTTPException(415, f"{upload.filename or 'File'} is not a valid PDF")
        if len(content) > settings.max_upload_mb * 1024 * 1024:
            raise HTTPException(413, f"{upload.filename} exceeds {settings.max_upload_mb} MB")
        created.append(create_document(db, upload, content))
    return created


@router.get("/documents", response_model=list[DocumentRead])
def list_documents(db: Session = Depends(get_db)):
    return list(db.scalars(document_query().order_by(Document.created_at.desc())))


@router.get("/documents/{document_id}", response_model=DocumentRead)
def get_document(document_id: str, db: Session = Depends(get_db)):
    document = db.scalar(document_query().where(Document.id == document_id))
    if not document:
        raise HTTPException(404, "Document not found")
    return document


@router.get("/documents/{document_id}/file")
def view_document(document_id: str, db: Session = Depends(get_db)):
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(404, "Document not found")
    path = settings.uploads_dir / document.stored_filename
    if not path.exists():
        raise HTTPException(404, "Document file not found")
    return FileResponse(path, media_type="application/pdf", filename=document.original_filename, content_disposition_type="inline")


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str, db: Session = Depends(get_db)):
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(404, "Document not found")
    (settings.uploads_dir / document.stored_filename).unlink(missing_ok=True)
    db.delete(document)
    db.commit()
    return Response(status_code=204)


@router.patch("/fields/{field_id}", response_model=FieldRead)
def update_field(field_id: str, payload: FieldUpdate, db: Session = Depends(get_db)):
    item = db.get(ExtractedField, field_id)
    if not item:
        raise HTTPException(404, "Field not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    item.is_edited = True
    db.commit()
    db.refresh(item)
    return item


@router.post("/exports", response_model=ExportRead, status_code=status.HTTP_201_CREATED)
def create_export(payload: ExportCreate, db: Session = Depends(get_db)):
    query = document_query().order_by(Document.created_at.desc())
    if payload.document_ids:
        query = query.where(Document.id.in_(payload.document_ids))
    documents = list(db.scalars(query))
    if not documents:
        raise HTTPException(400, "No documents available for export")
    record = Export(filename="pending.xlsx", document_count=len(documents))
    db.add(record)
    db.flush()
    record.filename = f"docflow-export-{record.id[:8]}.xlsx"
    build_workbook(documents, settings.exports_dir / record.filename)
    db.commit()
    db.refresh(record)
    return record


@router.get("/exports", response_model=list[ExportRead])
def list_exports(db: Session = Depends(get_db)):
    return list(db.scalars(select(Export).order_by(Export.created_at.desc())))


@router.get("/exports/{export_id}/download")
def download_export(export_id: str, db: Session = Depends(get_db)):
    record = db.get(Export, export_id)
    if not record:
        raise HTTPException(404, "Export not found")
    path = settings.exports_dir / record.filename
    if not path.exists():
        raise HTTPException(404, "Export file not found")
    return FileResponse(path, filename=record.filename, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
