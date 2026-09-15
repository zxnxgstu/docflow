import { ArrowRight, Check, FileSpreadsheet, FileText, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";

type Props = {
  greeting: string;
  name: string;
  onUpload: () => void;
  onDocuments: () => void;
};

export function DashboardHero({ greeting, name, onUpload, onDocuments }: Props) {
  return (
    <section className="product-hero">
      <div className="hero-glow hero-glow-one" />
      <div className="hero-glow hero-glow-two" />
      <div className="hero-copy">
        <span className="hero-kicker"><Sparkles size={14} /> {greeting}{name ? `, ${name}` : ""}</span>
        <h1>From PDF to <span>clean Excel</span>, without the busywork.</h1>
        <p>Upload documents, review the extracted details and download a polished workbook in one clear workflow.</p>
        <div className="hero-actions">
          <button className="hero-primary" onClick={onUpload}><UploadCloud size={17} /> Process documents</button>
          <button className="hero-secondary" onClick={onDocuments}>Browse workspace <ArrowRight size={16} /></button>
        </div>
        <div className="hero-trust">
          <span><Check size={13} /> Review before export</span>
          <span><Check size={13} /> Formatted worksheets</span>
          <span><ShieldCheck size={13} /> Your workspace, your data</span>
        </div>
      </div>

      <div className="hero-graphic" aria-label="Illustration of a PDF being transformed into an Excel workbook">
        <span className="graphic-label">EXAMPLE FLOW</span>
        <div className="source-document">
          <div className="source-head"><span><FileText size={15} /> invoice.pdf</span><i>PDF</i></div>
          <div className="source-line wide" /><div className="source-line medium" />
          <div className="source-field"><span>Invoice number</span><strong>INV-2048</strong></div>
          <div className="source-field"><span>Customer</span><strong>Northstar Labs</strong></div>
          <div className="source-field"><span>Total</span><strong>$2,480.00</strong></div>
        </div>
        <div className="flow-connector"><span /><i><Sparkles size={14} /></i><span /></div>
        <div className="output-workbook">
          <div className="workbook-head"><span><FileSpreadsheet size={15} /> DocFlow export</span><i>XLSX</i></div>
          <div className="sheet-tabs"><b>Summary</b><span>Fields</span><span>Tables</span></div>
          <div className="sheet-grid">
            <span className="cell head">Field</span><span className="cell head">Value</span>
            <span className="cell sheet-row-1">Invoice #</span><span className="cell accent sheet-row-1">INV-2048</span>
            <span className="cell sheet-row-2">Customer</span><span className="cell sheet-row-2">Northstar Labs</span>
            <span className="cell sheet-row-3">Total</span><span className="cell sheet-row-3">$2,480.00</span>
          </div>
        </div>
        <span className="floating-result"><span><Check size={12} /></span><strong>8 fields found</strong><small>Ready to review</small></span>
      </div>
    </section>
  );
}

