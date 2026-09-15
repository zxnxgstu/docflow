import { ArrowRight, Download, FileCheck2, FileSpreadsheet, Files, Gauge, Moon, Plus, ScanText, ShieldCheck, Sun, TableProperties, UploadCloud, WandSparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DashboardHero } from "./components/DashboardHero";
import { DocumentEditor } from "./components/DocumentEditor";
import { DocumentTable } from "./components/DocumentTable";
import { SearchCommand } from "./components/SearchCommand";
import { SettingsPage } from "./components/SettingsPage";
import { Sidebar, type View } from "./components/Sidebar";
import { UploadZone } from "./components/UploadZone";
import { api } from "./lib/api";
import { DEFAULT_PREFERENCES, loadPreferences, resolvedTheme, savePreferences, type Preferences } from "./preferences";
import type { Document, ExportRecord, Stats } from "./types";

const emptyStats: Stats = { documents: 0, pages: 0, fields: 0, tables: 0, exports: 0 };

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [selected, setSelected] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(() => resolvedTheme(preferences.theme));
  const uploadSection = useRef<HTMLElement>(null);

  const notify = (text: string) => {
    if (!preferences.notifications) return;
    setMessage(text);
    window.setTimeout(() => setMessage(null), 2600);
  };
  const load = useCallback(async () => {
    try {
      const [nextDocuments, nextStats, nextExports] = await Promise.all([api.documents(), api.stats(), api.exports()]);
      setDocuments(nextDocuments);
      setStats(nextStats);
      setExports(nextExports);
      if (selected) setSelected(nextDocuments.find((item) => item.id === selected.id) || null);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to connect to DocFlow API");
    } finally { setLoading(false); }
  }, [selected?.id]);

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyAppearance = () => {
      const theme = preferences.theme === "system" ? (media.matches ? "dark" : "light") : preferences.theme;
      setCurrentTheme(theme);
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.density = preferences.density;
      document.documentElement.dataset.reduceMotion = String(preferences.reduceMotion);
    };
    applyAppearance();
    media.addEventListener("change", applyAppearance);
    return () => media.removeEventListener("change", applyAppearance);
  }, [preferences.theme, preferences.density, preferences.reduceMotion]);

  const updatePreferences = (patch: Partial<Preferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      savePreferences(next);
      return next;
    });
  };

  const resetPreferences = () => {
    const next = { ...DEFAULT_PREFERENCES };
    savePreferences(next);
    setPreferences(next);
    notify("Recommended settings restored");
  };

  const upload = async (files: File[]) => {
    setUploading(true);
    try {
      const created = await api.upload(files);
      await load();
      notify(`${created.length} document${created.length > 1 ? "s" : ""} processed`);
      if (created.length === 1 && preferences.openAfterUpload) setSelected(created[0]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed");
    } finally { setUploading(false); }
  };

  const createExport = async () => {
    try {
      const record = await api.createExport();
      await load();
      if (preferences.autoDownloadExports) window.location.href = api.exportUrl(record.id);
      notify(preferences.autoDownloadExports ? "Excel workbook created" : "Workbook is ready in Exports");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Export failed"); }
  };

  const firstName = preferences.displayName.split(/\s+/).filter(Boolean)[0] || "";
  const successRate = documents.length ? Math.round(documents.filter((document) => document.status === "completed").length / documents.length * 100) : 0;
  const goToUpload = () => {
    setView("dashboard");
    window.setTimeout(() => uploadSection.current?.scrollIntoView({ behavior: preferences.reduceMotion ? "auto" : "smooth", block: "center" }), 50);
  };

  if (selected) return <DocumentEditor document={selected} onBack={() => setSelected(null)} onRefresh={load} notify={notify} showConfidence={preferences.showConfidence} autoDownloadExports={preferences.autoDownloadExports} />;

  return (
    <div className="app-shell">
      <Sidebar view={view} onChange={setView} displayName={preferences.displayName} workspaceName={preferences.workspaceName} />
      <div className="app-main">
        <header className="topbar">
          <SearchCommand documents={documents} onOpen={setSelected} />
          <div className="top-actions">
            <button className="icon-button theme-quick-toggle" title={`Switch to ${currentTheme === "dark" ? "light" : "dark"} theme`} onClick={() => updatePreferences({ theme: currentTheme === "dark" ? "light" : "dark" })}>{currentTheme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
            <button className="primary-button small" onClick={goToUpload}><Plus size={16} /> New upload</button>
          </div>
        </header>
        <main className="content">
          {error && <div className="error-banner"><span>{error}</span><button onClick={() => { setError(null); void load(); }}>Try again</button></div>}
          {view === "dashboard" && (
            <>
              <DashboardHero greeting={greeting()} name={firstName} onUpload={goToUpload} onDocuments={() => setView("documents")} />
              <section className="metrics-section">
                <Metric icon={<Files />} label="Documents" value={stats.documents} detail={`${stats.pages} pages processed`} tone="violet" />
                <Metric icon={<ScanText />} label="Fields captured" value={stats.fields} detail={`${stats.tables} tables detected`} tone="teal" />
                <Metric icon={<FileSpreadsheet />} label="Workbooks" value={stats.exports} detail="Ready-to-use exports" tone="orange" />
                <Metric icon={<Gauge />} label="Success rate" value={documents.length ? `${successRate}%` : "—"} detail={documents.length ? `${documents.filter((document) => document.status === "completed").length} of ${documents.length} completed` : "Waiting for first document"} tone="blue" progress={successRate} />
              </section>
              <section className="dashboard-grid workspace-section" ref={uploadSection}>
                <div><div className="section-title"><div><span className="section-kicker">NEW EXTRACTION</span><h2>Process documents</h2><p>Drop in one or several text-based PDFs. DocFlow handles the structure.</p></div></div><UploadZone onUpload={upload} busy={uploading} /></div>
                <aside className="workflow-card"><div className="workflow-card-top"><span className="workflow-card-icon"><WandSparkles size={20} /></span><span className="workflow-badge">GUIDED WORKFLOW</span></div><h3>Accurate data, with you in control.</h3><p className="workflow-intro">Every result stays editable before it becomes a workbook.</p><div className="workflow-timeline"><div className="workflow-step"><i><UploadCloud size={14} /></i><span><strong>Upload</strong><small>PDF invoices, forms or reports</small></span></div><div className="workflow-step"><i><TableProperties size={14} /></i><span><strong>Review</strong><small>Check fields, tables and confidence</small></span></div><div className="workflow-step"><i><FileSpreadsheet size={14} /></i><span><strong>Export</strong><small>Download five formatted sheets</small></span></div></div><div className="workflow-footer"><ShieldCheck size={15} /><span>You approve the data before export</span></div></aside>
              </section>
              <section className="recent-section"><div className="section-title"><div><span className="section-kicker">WORKSPACE</span><h2>Recent documents</h2><p>Continue reviewing your latest extraction activity.</p></div><button className="text-action" onClick={() => setView("documents")}>View all <ArrowRight size={15} /></button></div><DocumentTable compact documents={documents} onOpen={setSelected} onUpload={goToUpload} /></section>
            </>
          )}
          {view === "documents" && (
            <><div className="page-heading collection-heading"><div><span className="eyebrow">DOCUMENT LIBRARY</span><h1>Everything you have processed.</h1><p>Open a document to review fields, correct values and create an export.</p></div><button className="primary-button" onClick={goToUpload}><UploadCloud size={17} /> Upload documents</button></div><DocumentTable documents={documents} onOpen={setSelected} onUpload={goToUpload} /></>
          )}
          {view === "exports" && (
            <><div className="page-heading collection-heading"><div><span className="eyebrow">EXCEL WORKBOOKS</span><h1>Exports, ready when you are.</h1><p>Every workbook includes a summary, documents, fields, tables and processing report.</p></div><button className="primary-button" disabled={!documents.length} onClick={createExport}><Plus size={17} /> Create export</button></div>{!!exports.length && <div className="exports-overview"><span className="exports-overview-icon"><FileSpreadsheet size={22} /></span><div><strong>{exports.length} workbook{exports.length === 1 ? "" : "s"} generated</strong><small>Your most recent files are ready to download below.</small></div><span className="exports-total">{exports.reduce((total, item) => total + item.document_count, 0)} documents exported</span></div>}<div className="export-grid">{exports.map((item) => <article className="export-card" key={item.id}><span className="excel-mark"><FileSpreadsheet size={22} /></span><div><h3>{item.filename}</h3><p>{item.document_count} document{item.document_count !== 1 ? "s" : ""} · {new Date(item.created_at).toLocaleDateString()}</p><span>5 formatted worksheets</span></div><a className="icon-button" title="Download workbook" href={api.exportUrl(item.id)}><Download size={18} /></a></article>)}{!exports.length && !loading && <div className="big-empty exports-empty"><span><FileSpreadsheet size={30} /></span><h3>Your first workbook starts with a PDF</h3><p>Process a document, check the extracted values and export a clean Excel file.</p><button className="primary-button" onClick={goToUpload}>Process a document</button></div>}</div></>
          )}
          {view === "settings" && <SettingsPage preferences={preferences} apiConnected={!loading && !error} onChange={updatePreferences} onReset={resetPreferences} />}
        </main>
      </div>
      {message && <div className="toast"><span><FileCheck2 size={17} /></span>{message}</div>}
    </div>
  );
}

function Metric({ icon, label, value, detail, tone, progress }: { icon: React.ReactNode; label: string; value: string | number; detail: string; tone: string; progress?: number }) {
  return <article className={`metric-card ${tone}`}><div className="metric-top"><span className="metric-icon">{icon}</span><span className="metric-label">{label}</span></div><div className="metric-main"><strong>{value}</strong>{progress !== undefined && <span className="metric-ring" style={{ background: `conic-gradient(currentColor ${progress * 3.6}deg, var(--metric-track) 0deg)` }}><i /></span>}</div><div className="metric-detail"><span>{detail}</span></div></article>;
}
