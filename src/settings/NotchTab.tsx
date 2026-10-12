import { useState, useEffect } from "react";
import {
	PanelTop,
	Calendar,
	BellRing,
	Music,
	Minimize2,
	LayoutList,
	Sparkles,
	Circle,
	CloudSun,
	X,
	MonitorUp,
	Maximize2,
	CalendarClock,
	Mail,
	KeyRound,
	Trash2,
	Loader2,
	Check,
	AlertCircle,
	ExternalLink,
	ChevronDown
} from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { SettingRow } from "./SettingRow";
import { StatusWidgetConfig } from "../components/StatusWidgetConfig";
import type { WidgetConfig } from "./types";

interface NotchTabProps {
	notchMode: string;
	setNotchModeValue: (mode: string) => void;
	overlayAlways: boolean;
	toggleOverlayAlways: () => void;
	followActiveMonitor: boolean;
	toggleFollowActiveMonitor: () => void;
	calendarEnabled: boolean;
	toggleCalendar: () => void;
	timerSoundEnabled: boolean;
	toggleTimerSound: () => void;
	musicModeEnabled: boolean;
	toggleMusicMode: () => void;
	musicCompactNotch: boolean;
	toggleMusicCompactNotch: () => void;
	mediaLayout: "classic" | "compact";
	toggleMediaLayout: (layout: "classic" | "compact") => void;
	mediaAmbienceEnabled: boolean;
	toggleAmbience: () => void;
	mediaCompactGlowEnabled: boolean;
	toggleCompactGlow: () => void;
	weatherEnabled: boolean;
	toggleWeather: () => void;
	tempUnitFahrenheit: boolean;
	toggleTempUnit: () => void;
	cityName: string;
	setCityName: (name: string) => void;
	citySearchResults: Array<{ name: string; country: string; latitude: number; longitude: number }>;
	showCityDropdown: boolean;
	setShowCityDropdown: (show: boolean) => void;
	selectCity: (city: {
		name: string;
		country: string;
		latitude: number;
		longitude: number;
	}) => void;
	handleCityClear: () => void;
	statusWidgets: WidgetConfig;
	handleWidgetsChange: (config: WidgetConfig) => void;
	calendarSyncEnabled: boolean;
	toggleCalendarSync: () => void;
	calendarIcalUrl: string;
	saveCalendarUrl: (url: string) => void;
	calendarInterval: number;
	saveCalendarInterval: (minutes: number) => void;
	testCalendarUrl: (url: string) => Promise<number>;
	mailEnabled: boolean;
	toggleMail: () => void;
	mailAddress: string;
	saveMailAddress: (address: string) => void;
	mailImapHost: string;
	saveMailHost: (host: string) => void;
	mailInterval: number;
	saveMailInterval: (minutes: number) => void;
	mailHasPassword: boolean;
	testMailConnection: (address: string, host: string, password: string) => Promise<number>;
	saveMailPassword: (password: string) => Promise<void>;
	clearMailPassword: () => Promise<void>;
}

function SetupGuide({
	open,
	onToggle,
	buttonLabel,
	href,
	hrefLabel,
	steps
}: {
	open: boolean;
	onToggle: () => void;
	buttonLabel: string;
	href: string;
	hrefLabel: string;
	steps: string[];
}) {
	return (
		<div className="settings-guide">
			<div className="settings-guide-links">
				<button type="button" className="settings-link-btn" onClick={onToggle}>
					<ChevronDown size={11} className={`settings-guide-chevron${open ? " open" : ""}`} />
					{buttonLabel}
				</button>
				<button
					type="button"
					className="settings-link-btn"
					onClick={() => openUrl(href).catch(() => {})}
				>
					<ExternalLink size={11} />
					{hrefLabel}
				</button>
			</div>
			{open && (
				<ol className="settings-guide-steps">
					{steps.map((step, i) => (
						<li key={i}>{step}</li>
					))}
				</ol>
			)}
		</div>
	);
}

export function NotchTab({
	notchMode,
	setNotchModeValue,
	overlayAlways,
	toggleOverlayAlways,
	followActiveMonitor,
	toggleFollowActiveMonitor,
	calendarEnabled,
	toggleCalendar,
	timerSoundEnabled,
	toggleTimerSound,
	musicModeEnabled,
	toggleMusicMode,
	musicCompactNotch,
	toggleMusicCompactNotch,
	mediaLayout,
	toggleMediaLayout,
	mediaAmbienceEnabled,
	toggleAmbience,
	mediaCompactGlowEnabled,
	toggleCompactGlow,
	weatherEnabled,
	toggleWeather,
	tempUnitFahrenheit,
	toggleTempUnit,
	cityName,
	setCityName,
	citySearchResults,
	showCityDropdown,
	setShowCityDropdown,
	selectCity,
	handleCityClear,
	statusWidgets,
	handleWidgetsChange,
	calendarSyncEnabled,
	toggleCalendarSync,
	calendarIcalUrl,
	saveCalendarUrl,
	calendarInterval,
	saveCalendarInterval,
	testCalendarUrl,
	mailEnabled,
	toggleMail,
	mailAddress,
	saveMailAddress,
	mailImapHost,
	saveMailHost,
	mailInterval,
	saveMailInterval,
	mailHasPassword,
	testMailConnection,
	saveMailPassword,
	clearMailPassword
}: NotchTabProps) {
	const [calUrlDraft, setCalUrlDraft] = useState(calendarIcalUrl);
	const [calTesting, setCalTesting] = useState(false);
	const [calResult, setCalResult] = useState<"idle" | "ok" | "err">("idle");
	const [calResultMsg, setCalResultMsg] = useState("");
	const [showCalHelp, setShowCalHelp] = useState(false);

	const [mailAddrDraft, setMailAddrDraft] = useState(mailAddress);
	const [mailHostDraft, setMailHostDraft] = useState(mailImapHost);
	const [mailPassword, setMailPassword] = useState("");
	const [mailTesting, setMailTesting] = useState(false);
	const [mailResult, setMailResult] = useState<"idle" | "ok" | "err">("idle");
	const [mailResultMsg, setMailResultMsg] = useState("");
	const [showMailHelp, setShowMailHelp] = useState(false);

	useEffect(() => setCalUrlDraft(calendarIcalUrl), [calendarIcalUrl]);
	useEffect(() => setMailAddrDraft(mailAddress), [mailAddress]);
	useEffect(() => setMailHostDraft(mailImapHost), [mailImapHost]);

	const runCalTest = async () => {
		setCalTesting(true);
		setCalResult("idle");
		setCalResultMsg("");
		try {
			const url = calUrlDraft.trim();
			saveCalendarUrl(url);
			const count = await testCalendarUrl(url);
			setCalResult("ok");
			setCalResultMsg(
				count > 0
					? `${count} upcoming event${count === 1 ? "" : "s"} found`
					: "Connected — no upcoming events"
			);
		} catch (e: any) {
			setCalResult("err");
			setCalResultMsg(typeof e === "string" ? e : "Could not fetch calendar");
		} finally {
			setCalTesting(false);
		}
	};

	const runMailTest = async () => {
		setMailTesting(true);
		setMailResult("idle");
		setMailResultMsg("");
		try {
			const address = mailAddrDraft.trim();
			const host = mailHostDraft.trim() || "imap.gmail.com";
			saveMailAddress(address);
			saveMailHost(host);
			const unread = await testMailConnection(address, host, mailPassword);
			setMailResult("ok");
			setMailResultMsg(`${unread} unread message${unread === 1 ? "" : "s"}`);
		} catch (e: any) {
			setMailResult("err");
			setMailResultMsg(typeof e === "string" ? e : "Connection failed");
		} finally {
			setMailTesting(false);
		}
	};
	return (
		<>
			<div className="setting-group-label">Notch</div>
			<div className="setting-group">
				<SettingRow icon={PanelTop} label="Notch Behavior" desc="Choose how the notch appears">
					<select
						className="settings-select"
						value={notchMode}
						onChange={(e) => setNotchModeValue(e.target.value)}
					>
						<option value="fixed">Fixed</option>
						<option value="smart">Smart</option>
						<option value="peek">Peek</option>
					</select>
				</SettingRow>

				<SettingRow
					icon={MonitorUp}
					label="Follow Active Monitor"
					desc="Slide to the monitor of the window in focus"
				>
					<label className="toggle-switch">
						<input
							type="checkbox"
							checked={followActiveMonitor}
							onChange={toggleFollowActiveMonitor}
						/>
						<span className="slider"></span>
					</label>
				</SettingRow>

				<SettingRow
					icon={Maximize2}
					label="Always Show Over Fullscreen"
					desc="Keep the island interactive above fullscreen apps"
				>
					<label className="toggle-switch">
						<input type="checkbox" checked={overlayAlways} onChange={toggleOverlayAlways} />
						<span className="slider"></span>
					</label>
				</SettingRow>

				<SettingRow icon={Calendar} label="Calendar & Timer" desc="Enable productivity split-view">
					<label className="toggle-switch">
						<input type="checkbox" checked={calendarEnabled} onChange={toggleCalendar} />
						<span className="slider"></span>
					</label>
				</SettingRow>

				{calendarEnabled && (
					<SettingRow
						icon={BellRing}
						label="Timer Sound"
						desc="Play a chime when the timer finishes"
					>
						<label className="toggle-switch">
							<input type="checkbox" checked={timerSoundEnabled} onChange={toggleTimerSound} />
							<span className="slider"></span>
						</label>
					</SettingRow>
				)}

				<SettingRow icon={Music} label="Music Mode" desc="Interactive live music widget">
					<label className="toggle-switch">
						<input type="checkbox" checked={musicModeEnabled} onChange={toggleMusicMode} />
						<span className="slider"></span>
					</label>
				</SettingRow>

				{musicModeEnabled && (
					<>
						<SettingRow
							icon={Minimize2}
							label="Compact Mode"
							desc="Show visualizer & artwork when collapsed"
						>
							<label className="toggle-switch">
								<input
									type="checkbox"
									checked={musicCompactNotch}
									onChange={toggleMusicCompactNotch}
								/>
								<span className="slider"></span>
							</label>
						</SettingRow>

						<SettingRow icon={LayoutList} label="Media Layout" desc="Choose expanded player style">
							<div className="unit-toggle-minimal wide">
								<span
									className={mediaLayout === "classic" ? "active" : ""}
									onClick={() => toggleMediaLayout("classic")}
								>
									Classic
								</span>
								<span
									className={mediaLayout === "compact" ? "active" : ""}
									onClick={() => toggleMediaLayout("compact")}
								>
									Compact
								</span>
							</div>
						</SettingRow>

						<SettingRow
							icon={Sparkles}
							label="Ambient Glow"
							desc="Colored glow behind expanded album art"
						>
							<label className="toggle-switch">
								<input type="checkbox" checked={mediaAmbienceEnabled} onChange={toggleAmbience} />
								<span className="slider"></span>
							</label>
						</SettingRow>

						<SettingRow
							icon={Circle}
							label="Compact Glow"
							desc="Glow around collapsed thumbnail"
							divider={false}
						>
							<label className="toggle-switch">
								<input
									type="checkbox"
									checked={mediaCompactGlowEnabled}
									onChange={toggleCompactGlow}
								/>
								<span className="slider"></span>
							</label>
						</SettingRow>
					</>
				)}
			</div>

			<div className="setting-group-label">Weather</div>
			<div className="setting-group">
				<SettingRow
					icon={CloudSun}
					label="Weather Status"
					desc={cityName || "Auto-detect location"}
				>
					<div className="weather-controls">
						<div className="unit-toggle-minimal" onClick={toggleTempUnit}>
							<span className={!tempUnitFahrenheit ? "active" : ""}>C</span>
							<span className={tempUnitFahrenheit ? "active" : ""}>F</span>
						</div>
						<label className="toggle-switch">
							<input type="checkbox" checked={weatherEnabled} onChange={toggleWeather} />
							<span className="slider"></span>
						</label>
					</div>
				</SettingRow>

				{weatherEnabled && (
					<div className="manual-city-input">
						<div className="city-input-row">
							<input
								type="text"
								placeholder="Search city..."
								value={cityName}
								onChange={(e) => setCityName(e.target.value)}
								onFocus={() => citySearchResults.length > 0 && setShowCityDropdown(true)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && citySearchResults.length > 0) {
										e.preventDefault();
										selectCity(citySearchResults[0]);
									}
									if (e.key === "Escape") {
										setShowCityDropdown(false);
									}
								}}
								onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)}
							/>
							{cityName && (
								<button
									className="city-clear-btn"
									onMouseDown={(e) => {
										e.preventDefault();
										handleCityClear();
									}}
									title="Clear city"
								>
									<X size={10} strokeWidth={2.5} />
								</button>
							)}
						</div>
						{showCityDropdown && citySearchResults.length > 0 && (
							<div className="city-dropdown">
								{citySearchResults.map((city) => (
									<button
										key={`${city.name}-${city.latitude}`}
										className="city-dropdown-item"
										onMouseDown={(e) => {
											e.preventDefault();
											selectCity(city);
										}}
									>
										<span className="city-dropdown-name">{city.name}</span>
										<span className="city-dropdown-country">{city.country}</span>
									</button>
								))}
							</div>
						)}
					</div>
				)}
			</div>

			<div className="setting-group-label">Google Calendar</div>
			<div className="setting-group">
				<SettingRow
					icon={CalendarClock}
					label="Sync Google Calendar"
					desc="Show event dots on the month view"
				>
					<label className="toggle-switch">
						<input type="checkbox" checked={calendarSyncEnabled} onChange={toggleCalendarSync} />
						<span className="slider"></span>
					</label>
				</SettingRow>

				{calendarSyncEnabled && (
					<div className="manual-city-input">
						<div className="settings-input-row">
							<input
								className="settings-text-input"
								type="text"
								placeholder="https://calendar.google.com/calendar/ical/.../_private/.ics"
								value={calUrlDraft}
								spellCheck={false}
								onChange={(e) => setCalUrlDraft(e.target.value)}
								onBlur={() => calUrlDraft.trim() && saveCalendarUrl(calUrlDraft.trim())}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										runCalTest();
									}
								}}
							/>
							<button
								className="settings-action-btn"
								disabled={calTesting || !calUrlDraft.trim()}
								onClick={runCalTest}
							>
								{calTesting ? <Loader2 size={10} className="nook-loader" /> : <Check size={10} />}
								Test
							</button>
						</div>
						<SetupGuide
							open={showCalHelp}
							onToggle={() => setShowCalHelp((v) => !v)}
							buttonLabel="How do I get this?"
							href="https://calendar.google.com/calendar/u/0/r/settings"
							hrefLabel="Open Google Calendar"
							steps={[
								"Open Google Calendar and click the gear icon (Settings).",
								'Under "Settings for my calendars" pick the calendar in the left list.',
								'Scroll down to "Secret address in iCal format" and copy that URL.',
								"Paste it above and press Test — dots will appear on the month view."
							]}
						/>
						<div className="settings-input-row">
							<span className="settings-input-label">Refresh</span>
							<select
								className="settings-select"
								value={calendarInterval}
								onChange={(e) => saveCalendarInterval(parseInt(e.target.value))}
							>
								<option value={5}>5 min</option>
								<option value={15}>15 min</option>
								<option value={30}>30 min</option>
								<option value={60}>60 min</option>
							</select>
						</div>
						{calResult !== "idle" && (
							<div className={`settings-test-result ${calResult}`}>
								{calResult === "ok" ? <Check size={10} /> : <AlertCircle size={10} />}
								<span>{calResultMsg}</span>
							</div>
						)}
					</div>
				)}
			</div>

			<div className="setting-group-label">Mail</div>
			<div className="setting-group">
				<SettingRow icon={Mail} label="Unread Mail" desc="Gmail IMAP with an App Password">
					<label className="toggle-switch">
						<input type="checkbox" checked={mailEnabled} onChange={toggleMail} />
						<span className="slider"></span>
					</label>
				</SettingRow>

				{mailEnabled && (
					<div className="manual-city-input">
						<div className="settings-input-row">
							<input
								className="settings-text-input"
								type="text"
								placeholder="you@gmail.com"
								value={mailAddrDraft}
								spellCheck={false}
								onChange={(e) => setMailAddrDraft(e.target.value)}
								onBlur={() => mailAddrDraft.trim() && saveMailAddress(mailAddrDraft.trim())}
							/>
						</div>
						<SetupGuide
							open={showMailHelp}
							onToggle={() => setShowMailHelp((v) => !v)}
							buttonLabel="How do I get this?"
							href="https://myaccount.google.com/apppasswords"
							hrefLabel="Create App Password"
							steps={[
								"Turn on 2-Step Verification for your Google account.",
								'Open "App passwords" and create one (name it "Nook").',
								"Copy the 16-character password — it is NOT your normal password.",
								"Paste it below and press Save (stored encrypted with Windows DPAPI)."
							]}
						/>
						<div className="settings-input-row">
							<input
								className="settings-text-input"
								type="text"
								placeholder="imap.gmail.com"
								value={mailHostDraft}
								spellCheck={false}
								onChange={(e) => setMailHostDraft(e.target.value)}
								onBlur={() => mailHostDraft.trim() && saveMailHost(mailHostDraft.trim())}
							/>
						</div>
						<div className="settings-field-hint">
							Gmail uses imap.gmail.com · other providers use their own IMAP host
						</div>
						<div className="settings-input-row">
							<span className="settings-input-label">Refresh</span>
							<select
								className="settings-select"
								value={mailInterval}
								onChange={(e) => saveMailInterval(parseInt(e.target.value))}
							>
								<option value={1}>1 min</option>
								<option value={5}>5 min</option>
								<option value={15}>15 min</option>
								<option value={30}>30 min</option>
								<option value={60}>60 min</option>
							</select>
						</div>
						<div className="settings-input-row">
							<input
								className="settings-text-input"
								type="password"
								placeholder="App Password"
								value={mailPassword}
								onChange={(e) => setMailPassword(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") runMailTest();
								}}
							/>
							<button
								className="settings-action-btn"
								disabled={!mailPassword}
								onClick={async () => {
									try {
										await saveMailPassword(mailPassword);
										setMailPassword("");
										setMailResult("ok");
										setMailResultMsg("Password saved (Windows DPAPI)");
									} catch (e: any) {
										setMailResult("err");
										setMailResultMsg(typeof e === "string" ? e : "Failed to save password");
									}
								}}
								title="Save password"
							>
								<KeyRound size={10} />
								Save
							</button>
							<button
								className="settings-action-btn"
								disabled={mailTesting || !mailPassword || !mailAddrDraft.trim()}
								onClick={runMailTest}
								title="Test connection"
							>
								{mailTesting ? <Loader2 size={10} className="nook-loader" /> : <Check size={10} />}
								Test
							</button>
						</div>
						{mailHasPassword && (
							<div className="settings-input-row">
								<span className="settings-input-label">Saved</span>
								<button
									className="settings-action-btn settings-action-btn--danger"
									onClick={async () => {
										try {
											await clearMailPassword();
											setMailPassword("");
											setMailResult("idle");
											setMailResultMsg("");
										} catch (e: any) {
											setMailResult("err");
											setMailResultMsg(typeof e === "string" ? e : "Failed to clear password");
										}
									}}
								>
									<Trash2 size={10} />
									Clear saved password
								</button>
							</div>
						)}
						{mailResult !== "idle" && (
							<div className={`settings-test-result ${mailResult}`}>
								{mailResult === "ok" ? <Check size={10} /> : <AlertCircle size={10} />}
								<span>{mailResultMsg}</span>
							</div>
						)}
					</div>
				)}
			</div>

			<div className="setting-group-label">Widgets</div>
			<div className="setting-group">
				<StatusWidgetConfig value={statusWidgets} onChange={handleWidgetsChange} />
			</div>
		</>
	);
}
