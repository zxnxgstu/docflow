import {
  BellRing,
  Check,
  CircleUserRound,
  Database,
  ExternalLink,
  FileDown,
  Gauge,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { API_DOCS_URL } from "../lib/api";
import { type DensityPreference, type Preferences, type ThemePreference } from "../preferences";

type Section = "profile" | "appearance" | "workflow" | "system";

type Props = {
  preferences: Preferences;
  apiConnected: boolean;
  onChange: (patch: Partial<Preferences>) => void;
  onReset: () => void;
};

const initials = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join("") || "DF";

export function SettingsPage({ preferences, apiConnected, onChange, onReset }: Props) {
  const [section, setSection] = useState<Section>("profile");
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setSaved(false);
    const timeout = window.setTimeout(() => setSaved(true), 350);
    return () => window.clearTimeout(timeout);
  }, [preferences]);

  const sections = [
    { id: "profile" as const, label: "Profile & workspace", icon: CircleUserRound },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
    { id: "workflow" as const, label: "Workflow", icon: SlidersHorizontal },
    { id: "system" as const, label: "System & data", icon: Database },
  ];

  return (
    <div className="settings-page">
      <div className="settings-heading">
        <div><span className="eyebrow"><Settings2 size={14} /> PREFERENCES</span><h1>Settings</h1><p>Make DocFlow work the way you expect.</p></div>
        <span className={saved ? "autosave-state saved" : "autosave-state"}><Check size={14} /> {saved ? "Saved automatically" : "Saving changes…"}</span>
      </div>
      <div className="settings-layout">
        <aside className="settings-navigation">
          {sections.map(({ id, label, icon: Icon }) => (
            <button key={id} className={section === id ? "active" : ""} onClick={() => setSection(id)}><Icon size={17} /> <span>{label}</span></button>
          ))}
          <div className="settings-note"><Sparkles size={15} /><p><strong>No setup required</strong><span>Sensible defaults are already selected. Change only what you want.</span></p></div>
        </aside>

        <div className="settings-content">
          {section === "profile" && (
            <SettingsCard title="Profile & workspace" description="Personalize this browser without creating an account.">
              <div className="profile-overview">
                <span className="settings-avatar">{initials(preferences.displayName)}</span>
                <div><strong>{preferences.displayName || "Guest user"}</strong><span>{preferences.workspaceName || "Personal"} workspace</span></div>
                <span className="local-badge">Stored locally</span>
              </div>
              <div className="settings-form-grid">
                <SettingInput label="Display name" hint="Used only for the greeting and local profile." value={preferences.displayName} placeholder="For example, Nikita" maxLength={40} onChange={(value) => onChange({ displayName: value })} icon={<UserRound size={16} />} />
                <SettingInput label="Workspace name" hint="Shown in the sidebar for this browser." value={preferences.workspaceName} placeholder="Personal" maxLength={30} onChange={(value) => onChange({ workspaceName: value })} icon={<Sparkles size={16} />} />
              </div>
              <div className="privacy-callout"><Database size={17} /><span><strong>Your profile is private to this browser.</strong><small>These preferences are not sent to the API or saved in PostgreSQL.</small></span></div>
            </SettingsCard>
          )}

          {section === "appearance" && (
            <SettingsCard title="Appearance" description="Choose a comfortable look. System mode follows your device automatically.">
              <SettingGroup label="Color theme" hint="The interface updates immediately.">
                <div className="theme-options">
                  <ThemeOption value="system" current={preferences.theme} label="System" description="Follow device" icon={<Monitor size={19} />} onChange={(theme) => onChange({ theme })} />
                  <ThemeOption value="light" current={preferences.theme} label="Light" description="Bright and clear" icon={<Sun size={19} />} onChange={(theme) => onChange({ theme })} />
                  <ThemeOption value="dark" current={preferences.theme} label="Dark" description="Easy on the eyes" icon={<Moon size={19} />} onChange={(theme) => onChange({ theme })} />
                </div>
              </SettingGroup>
              <SettingRow icon={<Gauge size={17} />} title="Interface density" description="Compact mode fits more information on screen.">
                <div className="segmented-control">
                  {(["comfortable", "compact"] as DensityPreference[]).map((density) => <button key={density} className={preferences.density === density ? "active" : ""} onClick={() => onChange({ density })}>{density[0].toUpperCase() + density.slice(1)}</button>)}
                </div>
              </SettingRow>
              <SettingRow icon={<Sparkles size={17} />} title="Reduce motion" description="Minimize animated transitions throughout the interface.">
                <Toggle checked={preferences.reduceMotion} onChange={(reduceMotion) => onChange({ reduceMotion })} label="Reduce motion" />
              </SettingRow>
            </SettingsCard>
          )}

          {section === "workflow" && (
            <SettingsCard title="Workflow" description="Control what happens after common document actions.">
              <SettingRow icon={<FileDown size={17} />} title="Open after upload" description="Open the extraction editor automatically for a single uploaded PDF."><Toggle checked={preferences.openAfterUpload} onChange={(openAfterUpload) => onChange({ openAfterUpload })} label="Open after upload" /></SettingRow>
              <SettingRow icon={<FileDown size={17} />} title="Download exports immediately" description="Start the XLSX download as soon as a workbook is created."><Toggle checked={preferences.autoDownloadExports} onChange={(autoDownloadExports) => onChange({ autoDownloadExports })} label="Auto-download exports" /></SettingRow>
              <SettingRow icon={<Gauge size={17} />} title="Show confidence scores" description="Display extraction confidence next to detected field values."><Toggle checked={preferences.showConfidence} onChange={(showConfidence) => onChange({ showConfidence })} label="Show confidence" /></SettingRow>
              <SettingRow icon={<BellRing size={17} />} title="Action notifications" description="Show small confirmations after uploads, edits and exports."><Toggle checked={preferences.notifications} onChange={(notifications) => onChange({ notifications })} label="Show notifications" /></SettingRow>
            </SettingsCard>
          )}

          {section === "system" && (
            <>
              <SettingsCard title="System & data" description="A clear overview of this DocFlow environment.">
                <div className="system-grid">
                  <SystemItem label="API status" value={apiConnected ? "Connected" : "Unavailable"} status={apiConnected ? "success" : "error"} />
                  <SystemItem label="PDF upload limit" value="20 MB per file" />
                  <SystemItem label="Batch size" value="Up to 20 documents" />
                  <SystemItem label="Local timezone" value={Intl.DateTimeFormat().resolvedOptions().timeZone || "Browser default"} />
                </div>
                <a className="system-link" href={API_DOCS_URL} target="_blank" rel="noreferrer"><span><Database size={17} /><span><strong>Open API documentation</strong><small>Explore endpoints and test requests in Swagger.</small></span></span><ExternalLink size={16} /></a>
              </SettingsCard>
              <SettingsCard title="Reset preferences" description="Restore the recommended defaults without deleting documents or exports." danger>
                <div className="reset-row"><div><strong>Restore default settings</strong><p>Your uploaded documents and database records stay untouched.</p></div><button className="reset-button" onClick={onReset}><RotateCcw size={15} /> Reset preferences</button></div>
              </SettingsCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsCard({ title, description, children, danger = false }: { title: string; description: string; children: React.ReactNode; danger?: boolean }) {
  return <section className={danger ? "settings-card danger" : "settings-card"}><div className="settings-card-head"><h2>{title}</h2><p>{description}</p></div><div className="settings-card-body">{children}</div></section>;
}

function SettingGroup({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return <div className="setting-group"><div><strong>{label}</strong><p>{hint}</p></div>{children}</div>;
}

function SettingRow({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return <div className="setting-row"><span className="setting-row-icon">{icon}</span><span className="setting-row-copy"><strong>{title}</strong><small>{description}</small></span><span className="setting-row-control">{children}</span></div>;
}

function SettingInput({ label, hint, value, placeholder, maxLength, icon, onChange }: { label: string; hint: string; value: string; placeholder: string; maxLength: number; icon: React.ReactNode; onChange: (value: string) => void }) {
  return <label className="setting-input"><span>{label}</span><div>{icon}<input value={value} placeholder={placeholder} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} /></div><small>{hint}</small></label>;
}

function ThemeOption({ value, current, label, description, icon, onChange }: { value: ThemePreference; current: ThemePreference; label: string; description: string; icon: React.ReactNode; onChange: (value: ThemePreference) => void }) {
  return <button className={value === current ? "theme-option active" : "theme-option"} onClick={() => onChange(value)}><span>{icon}</span><strong>{label}</strong><small>{description}</small>{value === current && <i><Check size={11} /></i>}</button>;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={checked ? "toggle active" : "toggle"} onClick={() => onChange(!checked)}><span /></button>;
}

function SystemItem({ label, value, status }: { label: string; value: string; status?: "success" | "error" }) {
  return <div className="system-item"><span>{label}</span><strong className={status || ""}>{status && <i />}{value}</strong></div>;
}
