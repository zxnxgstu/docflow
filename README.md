# DocFlow

**Document Data Extraction & Excel Automation**

DocFlow is a full-stack application that turns text-based PDF documents into structured, reviewable data and polished Excel workbooks. It is designed as a portfolio-ready product rather than a demo CRUD app.

Version 0.2 introduces a product-focused interface with a custom PDF-to-Excel visual, clearer onboarding, responsive light and dark themes, actionable empty states and a cohesive design system across the dashboard, document library, editor, exports and settings.

## What it does

- uploads one or many PDF files with type and size validation;
- extracts page text, key-value fields and tables;
- assigns field types and confidence scores;
- shows the original PDF beside an editable extraction result;
- searches across filenames, extracted field names and values;
- keeps an optional display name locally in the visitor's browser;
- provides a complete auto-saving Settings area for appearance and workflow;
- supports native light, dark and system themes plus compact and reduced-motion modes;
- stores documents and extraction data in PostgreSQL;
- creates formatted `.xlsx` workbooks with five worksheets;
- exposes an OpenAPI-documented REST API;
- runs locally with Docker Compose.

## Product flow

```mermaid
flowchart LR
    A[Upload PDFs] --> B[Extract content]
    B --> C[Review fields]
    C --> D[Generate workbook]
    D --> E[Download XLSX]
```

## Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, custom responsive design system |
| Backend | FastAPI, Pydantic, SQLAlchemy |
| Database | PostgreSQL; SQLite fallback for quick local development |
| PDF engine | PyMuPDF, pdfplumber |
| Excel engine | openpyxl |
| Quality | pytest, TypeScript strict mode, GitHub Actions |
| Infrastructure | Docker, Docker Compose |

## Quick start with Docker

Requirements: Docker Desktop with Docker Compose.

```bash
git clone <your-repository-url>
cd docflow
docker compose up --build
```

Then open:

- UI: <http://localhost:5173>
- API docs: <http://localhost:8000/docs>
- health check: <http://localhost:8000/api/v1/health>

The Compose environment uses PostgreSQL automatically and persists uploaded documents and exports in `storage/`.

## Local development without Docker

### Backend

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

macOS/Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Without `DATABASE_URL`, the backend uses a local SQLite database for convenience.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Excel workbook structure

Every export contains:

1. **Summary** — document, page, field, table and edit totals.
2. **Documents** — file metadata and processing status.
3. **Extracted Fields** — values, types, pages, confidence and edit state.
4. **Extracted Tables** — detected table rows in a portable representation.
5. **Processing Report** — per-document quality and error overview.

Worksheets include styled headers, filters, frozen panes, row striping, sensible column widths and numeric formats.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Service health |
| `GET` | `/api/v1/stats` | Dashboard metrics |
| `POST` | `/api/v1/documents` | Upload and process PDFs |
| `GET` | `/api/v1/documents` | List processed documents |
| `GET` | `/api/v1/documents/{id}` | Document extraction result |
| `PATCH` | `/api/v1/fields/{id}` | Correct an extracted value |
| `DELETE` | `/api/v1/documents/{id}` | Delete a document |
| `POST` | `/api/v1/exports` | Generate an Excel workbook |
| `GET` | `/api/v1/exports/{id}/download` | Download an export |

## Tests

```bash
cd backend
pytest -q

cd ../frontend
npm run build
```

The integration test creates a PDF in memory and verifies the complete upload → extract → edit → Excel download flow.

## Architecture

The project uses a modular monolith: HTTP routes orchestrate application services, while PDF and Excel processing remain independent modules. That keeps the MVP deployable as one unit without mixing document parsing with API or persistence concerns.

```text
React UI → FastAPI routes → services → SQLAlchemy → PostgreSQL
                         ↘ PDF engine
                         ↘ Excel engine
```

## Current limitations and roadmap

The MVP targets PDFs with an embedded text layer. Scanned pages are accepted, but require OCR before useful fields can be extracted.

### Local preferences

User-facing preferences are intentionally stored in the browser rather than the database. Each visitor can set a display name and workspace name, choose a theme and density, and control post-upload and post-export behavior without creating an account. The recommended defaults work without any setup.

- [ ] OCR for scanned documents
- [ ] extraction templates for invoices and forms
- [ ] background jobs and progress events
- [ ] authentication and per-user workspaces
- [ ] Alembic production migrations
- [ ] object storage for deployment
- [ ] CSV export and webhooks

## License

MIT
