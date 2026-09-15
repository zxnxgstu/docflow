import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import fitz
import pdfplumber


@dataclass
class ParsedField:
    name: str
    value: str
    page: int
    kind: str = "text"
    confidence: float = 0.86


@dataclass
class ParsedTable:
    page: int
    index: int
    rows: list[list[Any]]


@dataclass
class ParsedDocument:
    page_count: int
    fields: list[ParsedField] = field(default_factory=list)
    tables: list[ParsedTable] = field(default_factory=list)


FIELD_PATTERN = re.compile(r"^\s*([\w][\w .#()\-/]{1,60}?)\s*[:：]\s*(.+?)\s*$")
MONEY_PATTERN = re.compile(r"(?:[$€£₴]\s?\d|\d[\d ,.]+\s?(?:USD|EUR|UAH|GBP))", re.I)
DATE_PATTERN = re.compile(r"\b(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}-\d{2}-\d{2})\b")


def _kind(value: str) -> str:
    if MONEY_PATTERN.search(value):
        return "currency"
    if DATE_PATTERN.search(value):
        return "date"
    if value.replace(" ", "").replace(",", ".").replace(".", "", 1).isdigit():
        return "number"
    return "text"


def _extract_fields(text: str, page: int) -> list[ParsedField]:
    fields: list[ParsedField] = []
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for index, line in enumerate(lines):
        match = FIELD_PATTERN.match(line)
        if match:
            name, value = match.groups()
            fields.append(ParsedField(name=name.strip(), value=value.strip(), page=page, kind=_kind(value), confidence=0.94))
        elif line.endswith(":") and index + 1 < len(lines) and len(line) < 64:
            value = lines[index + 1]
            fields.append(ParsedField(name=line[:-1].strip(), value=value, page=page, kind=_kind(value), confidence=0.82))
    # Keep the best occurrence if a label was detected twice on the same page.
    unique: dict[tuple[str, int], ParsedField] = {}
    for item in fields:
        key = (item.name.casefold(), item.page)
        if key not in unique or item.confidence > unique[key].confidence:
            unique[key] = item
    return list(unique.values())


def extract_pdf(path: Path) -> ParsedDocument:
    try:
        with fitz.open(path) as document:
            page_count = document.page_count
            fields = []
            for page_index, page in enumerate(document, start=1):
                fields.extend(_extract_fields(page.get_text("text"), page_index))
    except Exception as exc:
        raise ValueError("The file is not a readable PDF document") from exc

    tables: list[ParsedTable] = []
    try:
        with pdfplumber.open(path) as document:
            for page_index, page in enumerate(document.pages, start=1):
                for table_index, rows in enumerate(page.extract_tables(), start=1):
                    cleaned = [[cell or "" for cell in row] for row in rows if row]
                    if cleaned:
                        tables.append(ParsedTable(page=page_index, index=table_index, rows=cleaned))
    except Exception:
        # Table extraction is best-effort; readable text should still produce a result.
        pass

    return ParsedDocument(page_count=page_count, fields=fields, tables=tables)

