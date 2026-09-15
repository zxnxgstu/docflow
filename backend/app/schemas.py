from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class FieldRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    page_number: int
    field_name: str
    field_value: str
    field_type: str
    confidence: float
    is_edited: bool


class TableRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    page_number: int
    table_index: int
    data_json: list[list[Any]]


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    original_filename: str
    file_size: int
    page_count: int
    status: str
    error_message: str | None
    created_at: datetime
    processed_at: datetime | None
    fields: list[FieldRead] = []
    tables: list[TableRead] = []


class FieldUpdate(BaseModel):
    field_name: str | None = Field(default=None, min_length=1, max_length=255)
    field_value: str | None = Field(default=None, max_length=10000)


class ExportCreate(BaseModel):
    document_ids: list[str] = []


class ExportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    filename: str
    document_count: int
    created_at: datetime


class DashboardStats(BaseModel):
    documents: int
    pages: int
    fields: int
    tables: int
    exports: int
