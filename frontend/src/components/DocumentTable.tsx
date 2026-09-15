import { ChevronRight, FileText, UploadCloud } from "lucide-react";
import type { Document } from "../types";

type Props = { documents: Document[]; onOpen: (document: Document) => void; onUpload?: () => void; compact?: boolean };

const date = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export function DocumentTable({ documents, onOpen, onUpload, compact }: Props) {
  const visible = compact ? documents.slice(0, 5) : documents;
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead><tr><th>Document</th><th>Status</th><th>Pages</th><th>Extracted</th><th>Created</th><th /></tr></thead>
        <tbody>
          {visible.map((document) => (
            <tr key={document.id} onClick={() => onOpen(document)}>
              <td><span className="doc-cell"><span className="pdf-icon"><FileText size={18} /></span><span><strong>{document.original_filename}</strong><small>{(document.file_size / 1024).toFixed(0)} KB</small></span></span></td>
              <td><span className={`status ${document.status}`}><i />{document.status}</span></td>
              <td>{document.page_count}</td>
              <td>{document.fields.length} fields{document.tables.length ? ` · ${document.tables.length} tables` : ""}</td>
              <td>{date(document.created_at)}</td>
              <td><button className="icon-button" aria-label="Open"><ChevronRight size={18} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!visible.length && <div className="table-empty"><div className="empty-docs-art"><span /><span /><FileText size={24} /></div><strong>Your workspace is ready</strong><span>Upload a PDF to extract fields, tables and structured data.</span>{onUpload && <button className="empty-action" onClick={onUpload}><UploadCloud size={14} /> Upload first document</button>}</div>}
    </div>
  );
}
