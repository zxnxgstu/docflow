import { ArrowLeft, Check, Download, FileSearch, Loader2, Save, Table2 } from "lucide-react";
import { useState } from "react";
import { api } from "../lib/api";
import type { Document, ExtractedField } from "../types";

type Props = {
  document: Document;
  onBack: () => void;
  onRefresh: () => Promise<void>;
  notify: (message: string) => void;
  showConfidence: boolean;
  autoDownloadExports: boolean;
};

export function DocumentEditor({ document, onBack, onRefresh, notify, showConfidence, autoDownloadExports }: Props) {
  const [fields, setFields] = useState(document.fields);
  const [saving, setSaving] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const change = (id: string, value: string) => setFields((items) => items.map((item) => item.id === id ? { ...item, field_value: value } : item));
  const save = async (field: ExtractedField) => {
    const original = document.fields.find((item) => item.id === field.id);
    if (original?.field_value === field.field_value) return;
    setSaving(field.id);
    try { await api.updateField(field.id, field.field_value); notify("Field saved"); await onRefresh(); } finally { setSaving(null); }
  };
  const createExport = async () => {
    setExporting(true);
    try {
      const record = await api.createExport([document.id]);
      await onRefresh();
      if (autoDownloadExports) window.location.href = api.exportUrl(record.id);
      notify(autoDownloadExports ? "Excel workbook created" : "Workbook is ready in Exports");
    } finally { setExporting(false); }
  };
  return (
    <main className="editor-page">
      <div className="editor-toolbar">
        <div><button className="back-button" onClick={onBack}><ArrowLeft size={17} /> Documents</button><h1>{document.original_filename}</h1><p>{document.page_count} pages · {document.fields.length} fields · processed successfully</p></div>
        <button className="primary-button" onClick={createExport} disabled={exporting}>{exporting ? <Loader2 className="spin" size={17} /> : <Download size={17} />} Export Excel</button>
      </div>
      <div className="editor-grid">
        <section className="pdf-panel">
          <div className="panel-head"><span><FileSearch size={17} /> Document preview</span><span className="page-pill">{document.page_count} page{document.page_count !== 1 ? "s" : ""}</span></div>
          <iframe title={document.original_filename} src={api.fileUrl(document.id)} />
        </section>
        <section className="fields-panel">
          <div className="panel-head"><span><Check size={17} /> Extracted fields</span>{showConfidence && <span className="quality-pill">{Math.round((fields.reduce((sum, item) => sum + item.confidence, 0) / Math.max(fields.length, 1)) * 100)}% avg.</span>}</div>
          <div className="fields-list">
            {fields.map((field) => (
              <label className="field-row" key={field.id}>
                <span className="field-meta"><strong>{field.field_name}</strong><small>Page {field.page_number} · {field.field_type}</small></span>
                <span className={showConfidence ? "field-input-wrap" : "field-input-wrap no-confidence"}>
                  <input value={field.field_value} onChange={(event) => change(field.id, event.target.value)} onBlur={() => save(field)} />
                  {showConfidence && <span className={field.confidence < .85 ? "confidence low" : "confidence"}>{Math.round(field.confidence * 100)}%</span>}
                  <span className="save-state">{saving === field.id ? <Loader2 className="spin" size={15} /> : field.is_edited ? <Save size={14} /> : null}</span>
                </span>
              </label>
            ))}
            {!fields.length && <div className="fields-empty"><FileSearch size={28} /><strong>No key-value fields detected</strong><p>The document can still contain extracted tables and be exported.</p></div>}
          </div>
          {!!document.tables.length && <div className="detected-tables"><Table2 size={17} /><span><strong>{document.tables.length} table{document.tables.length > 1 ? "s" : ""} detected</strong><small>Included in the Excel workbook</small></span></div>}
        </section>
      </div>
    </main>
  );
}
