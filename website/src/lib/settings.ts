import { DEFAULT_WIDGET_CONFIG, type WidgetConfig } from "./statusWidgets";
import { DEFAULT_CITY } from "./simulatedWeather";

export interface NookSettings {
	wallpaper: number;
	dockMode: "fixed" | "auto-hide";
	notchMode: "fixed" | "smart" | "peek";
	accentColor: string;
	isDockEnabled: boolean;
	// Notch behaviour, mirroring the desktop app's NotchTab.
	followActiveMonitor: boolean;
	alwaysShowOverFullscreen: boolean;
	calendarEnabled: boolean;
	timerSoundEnabled: boolean;
	musicModeEnabled: boolean;
	musicCompactNotch: boolean;
	mediaLayout: "classic" | "compact";
	mediaAmbienceEnabled: boolean;
	mediaCompactGlowEnabled: boolean;
	// Weather.
	weatherEnabled: boolean;
	tempUnitFahrenheit: boolean;
	cityName: string;
	// Status widgets shown either side of the notch clock.
	statusWidgets: WidgetConfig;
}

export const defaultSettings: NookSettings = {
	wallpaper: 0,
	dockMode: "fixed",
	notchMode: "fixed",
	accentColor: "#e8c5e5",
	isDockEnabled: true,
	followActiveMonitor: true,
	alwaysShowOverFullscreen: true,
	calendarEnabled: true,
	timerSoundEnabled: true,
	musicModeEnabled: true,
	musicCompactNotch: true,
	mediaLayout: "classic",
	mediaAmbienceEnabled: true,
	mediaCompactGlowEnabled: true,
	weatherEnabled: true,
	tempUnitFahrenheit: false,
	cityName: DEFAULT_CITY,
	statusWidgets: DEFAULT_WIDGET_CONFIG
};

/**
 * Demos saved before the notch gained the real app's options stored
 * notchMode as "auto-hide", which no longer exists. Peek is the behaviour that
 * survives contact with the new set of modes, so map it across. Anything that
 * predates a key falls back to the default rather than to undefined.
 */
export function migrateSettings(raw: Partial<NookSettings> | null): NookSettings {
	if (!raw) return defaultSettings;
	const merged: NookSettings = { ...defaultSettings, ...raw };
	if (merged.notchMode === ("auto-hide" as NookSettings["notchMode"])) {
		merged.notchMode = "peek";
	}
	if (!merged.statusWidgets || !Array.isArray(merged.statusWidgets.left)) {
		merged.statusWidgets = DEFAULT_WIDGET_CONFIG;
	}
	if (typeof merged.cityName !== "string" || merged.cityName.length === 0) {
		merged.cityName = DEFAULT_CITY;
	}
	return merged;
}

export function loadSettings(): NookSettings {
	// Pre-4.2 demos stored the same blob under "bloom-settings"; read it as a fallback.
	const saved = localStorage.getItem("nook-settings") ?? localStorage.getItem("bloom-settings");
	if (!saved) return defaultSettings;
	try {
		return migrateSettings(JSON.parse(saved) as Partial<NookSettings>);
	} catch {
		return defaultSettings;
	}
}

/**
 * Callers pass a concrete key and its matching value. Kept as a plain
 * (non-generic) signature because TypeScript cannot relate two independently
 * declared generic callback signatures across module boundaries.
 */
export type UpdateSetting = (
	key: keyof NookSettings,
	value: NookSettings[keyof NookSettings]
) => void;
