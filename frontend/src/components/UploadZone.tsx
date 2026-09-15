import { FileText, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";

type Props = { onUpload: (files: File[]) => Promise<void>; busy: boolean };

export function UploadZone({ onUpload, busy }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

  const choose = (incoming: File[]) => setFiles(incoming.filter((file) => file.type === "application/pdf" || file.name.endsWith(".pdf")).slice(0, 20));
  const submit = async () => {
    if (!files.length) return;
    await onUpload(files);
    setFiles([]);
    if (input.current) input.current.value = "";
  };
  return (
    <section className="upload-card">
      <div
        className={dragging ? "dropzone dragging" : "dropzone"}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); choose([...event.dataTransfer.files]); }}
      >
        <input ref={input} hidden type="file" accept="application/pdf" multiple onChange={(event) => choose([...(event.target.files || [])])} />
        <div className="upload-visual"><span className="upload-sheet back" /><span className="upload-sheet middle" /><span className="upload-icon"><UploadCloud size={26} /></span></div>
        <h3>{busy ? "Reading pages and detecting fields…" : "Bring your documents into DocFlow"}</h3>
        <p>Drop PDF invoices, forms or reports anywhere in this area.</p>
        <div className="upload-actions"><button className="browse-button" onClick={() => input.current?.click()}>Choose PDF files</button><span>or drag & drop</span></div>
        <small><FileText size={12} /> Text-based PDFs <i /> up to 20 MB each <i /> 20 files per batch</small>
      </div>
      {!!files.length && (
        <div className="upload-queue">
          <div className="queue-head"><strong>{files.length} file{files.length > 1 ? "s" : ""} ready</strong><span>{(files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1)} MB</span></div>
          {files.map((file) => (
            <div className="queue-file" key={`${file.name}-${file.size}`}>
              <span className="filetype"><FileText size={17} /></span><span><strong>{file.name}</strong><small>{(file.size / 1024).toFixed(0)} KB</small></span>
              <button aria-label="Remove" onClick={() => setFiles((current) => current.filter((item) => item !== file))}><X size={16} /></button>
            </div>
          ))}
          <button className="primary-button full" disabled={busy} onClick={submit}>{busy ? "Extracting data…" : `Process ${files.length} document${files.length > 1 ? "s" : ""}`}</button>
        </div>
      )}
    </section>
  );
}
