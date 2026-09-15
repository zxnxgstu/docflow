import type { Document, ExportRecord, ExtractedField, Stats } from "../types";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
export const API_DOCS_URL = API_URL.replace(/\/api\/v1\/?$/, "/docs");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail || "Something went wrong. Please try again.");
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const api = {
  stats: () => request<Stats>("/stats"),
  documents: () => request<Document[]>("/documents"),
  document: (id: string) => request<Document>(`/documents/${id}`),
  upload: (files: File[]) => {
    const body = new FormData();
    files.forEach((file) => body.append("files", file));
    return request<Document[]>("/documents", { method: "POST", body });
  },
  updateField: (id: string, field_value: string) => request<ExtractedField>(`/fields/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ field_value }),
  }),
  deleteDocument: (id: string) => request<void>(`/documents/${id}`, { method: "DELETE" }),
  exports: () => request<ExportRecord[]>("/exports"),
  createExport: (document_ids: string[] = []) => request<ExportRecord>("/exports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_ids }),
  }),
  fileUrl: (id: string) => `${API_URL}/documents/${id}/file`,
  exportUrl: (id: string) => `${API_URL}/exports/${id}/download`,
};
