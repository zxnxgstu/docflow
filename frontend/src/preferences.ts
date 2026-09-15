export type ThemePreference = "system" | "light" | "dark";
export type DensityPreference = "comfortable" | "compact";

export type Preferences = {
  displayName: string;
  workspaceName: string;
  theme: ThemePreference;
  density: DensityPreference;
  reduceMotion: boolean;
  openAfterUpload: boolean;
  autoDownloadExports: boolean;
  showConfidence: boolean;
  notifications: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  displayName: "",
  workspaceName: "Personal",
  theme: "system",
  density: "comfortable",
  reduceMotion: false,
  openAfterUpload: true,
  autoDownloadExports: true,
  showConfidence: true,
  notifications: true,
};

const STORAGE_KEY = "docflow.preferences.v1";

export function loadPreferences(): Preferences {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Partial<Preferences>;
    const legacyName = localStorage.getItem("docflow.displayName") || "";
    return { ...DEFAULT_PREFERENCES, ...stored, displayName: stored.displayName ?? legacyName };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: Preferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    localStorage.removeItem("docflow.displayName");
  } catch {
    // The UI remains usable when a privacy mode blocks persistent storage.
  }
}

export function resolvedTheme(theme: ThemePreference): "light" | "dark" {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
