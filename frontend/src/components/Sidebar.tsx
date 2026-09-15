import { FileSpreadsheet, Files, LayoutDashboard, Settings, Sparkles } from "lucide-react";

export type View = "dashboard" | "documents" | "exports" | "settings";

type Props = { view: View; onChange: (view: View) => void };

type SidebarProps = Props & { displayName: string; workspaceName: string };

const initials = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join("") || "DF";

export function Sidebar({ view, onChange, displayName, workspaceName }: SidebarProps) {
  const links = [
    { id: "dashboard" as const, label: "Overview", icon: LayoutDashboard },
    { id: "documents" as const, label: "Documents", icon: Files },
    { id: "exports" as const, label: "Exports", icon: FileSpreadsheet },
  ];
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onChange("dashboard")}>
        <span className="brand-mark"><span /></span>
        <span className="brand-copy"><strong>DocFlow</strong><small>Document workspace</small></span>
      </button>
      <button className="workspace-card" onClick={() => onChange("settings")}>
        <span className="workspace-icon"><Sparkles size={15} /></span>
        <span><small>Workspace</small><strong>{workspaceName || "Personal"}</strong></span>
        <span className="workspace-plan">LOCAL</span>
      </button>
      <nav>
        <p className="nav-label">Workspace</p>
        {links.map(({ id, label, icon: Icon }) => (
          <button key={id} className={view === id ? "nav-item active" : "nav-item"} onClick={() => onChange(id)}>
            <Icon size={18} strokeWidth={1.8} /> {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className={view === "settings" ? "nav-item active" : "nav-item"} onClick={() => onChange("settings")}><Settings size={18} /> Settings</button>
        <button className="profile" onClick={() => onChange("settings")} title="Open settings">
          <span className="avatar">{initials(displayName)}</span>
          <span><strong>{displayName || "Guest user"}</strong><small>{workspaceName || "Personal"} workspace</small></span>
        </button>
      </div>
    </aside>
  );
}
