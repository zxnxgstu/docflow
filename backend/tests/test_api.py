from io import BytesIO

import fitz


def sample_pdf() -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), "Invoice Number: INV-1042\nCustomer: Acme Ltd\nDate: 2026-09-15\nTotal: $1,240.00")
    content = document.tobytes()
    document.close()
    return content


def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_upload_extract_edit_and_export(client):
    response = client.post("/api/v1/documents", files=[("files", ("invoice.pdf", sample_pdf(), "application/pdf"))])
    assert response.status_code == 201
    document = response.json()[0]
    assert document["status"] == "completed"
    assert document["page_count"] == 1
    assert len(document["fields"]) >= 3

    field = document["fields"][0]
    edited = client.patch(f"/api/v1/fields/{field['id']}", json={"field_value": "INV-2048"})
    assert edited.status_code == 200
    assert edited.json()["is_edited"] is True

    exported = client.post("/api/v1/exports", json={"document_ids": [document["id"]]})
    assert exported.status_code == 201
    download = client.get(f"/api/v1/exports/{exported.json()['id']}/download")
    assert download.status_code == 200
    assert download.content.startswith(b"PK")

