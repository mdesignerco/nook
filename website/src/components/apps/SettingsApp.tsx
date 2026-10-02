import { useState } from "react";
import { StatusWidgetConfig } from "../StatusWidgetConfig";
import { searchCities, SIM_CITIES, DEFAULT_CITY } from "../../lib/simulatedWeather";
import { WIDGET_DEFS } from "../../lib/statusWidgets";
import type { NookSettings, UpdateSetting } from "../../lib/settings";

interface SettingsAppProps {
	settings: NookSettings;
	updateSetting: UpdateSetting;
	wallpapersList: string[];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div>
			<div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2">
				{title}
			</div>
			<div className="bg-white/[0.03] border border-white/[0.05] rounded-xl">{children}</div>
		</div>
	);
}

function Row({
	title,
	description,
	children
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-4 p-3">
			<div className="flex flex-col min-w-0">
				<span className="font-medium text-white/90">{title}</span>
				{description && <span className="text-[11px] text-white/40">{description}</span>}
			</div>
			<div className="shrink-0">{children}</div>
		</div>
	);
}

function Toggle({
	checked,
	onChange,
	label
}: {
	checked: boolean;
	onChange: (next: boolean) => void;
	label: string;
}) {
	return (
		<label className="relative inline-flex items-center cursor-pointer">
			<input
				type="checkbox"
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				aria-label={label}
				className="sr-only peer"
			/>
			<div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white/40"></div>
		</label>
	);
}

function Select<T extends string>({
	value,
	onChange,
	options,
	label
}: {
	value: T;
	onChange: (next: T) => void;
	options: { value: T; label: string }[];
	label: string;
}) {
	return (
		<select
			value={value}
			aria-label={label}
			onChange={(e) => onChange(e.target.value as T)}
			className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[12px] focus:outline-none focus:border-white/30 text-white"
		>
			{options.map((opt) => (
				<option key={opt.value} value={opt.value}>
					{opt.label}
				</option>
			))}
		</select>
	);
}

function CityPicker({
	cityName,
	onChange
}: {
	cityName: string;
	onChange: (next: string) => void;
}) {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const matches = searchCities(query);
	const current = SIM_CITIES.find((c) => c.name === cityName);

	return (
		<div className="relative w-[150px]">
			<button
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[12px] text-left flex items-center justify-between gap-2 hover:border-white/20"
			>
				<span className="truncate">{cityName || DEFAULT_CITY}</span>
				<span className="text-[10px] text-white/35">
					{current ? `${current.celsius}°C` : ""}
				</span>
			</button>
			{open && (
				<>
					<div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
					<div className="absolute right-0 top-full mt-1 z-20 w-[220px] rounded-lg border border-white/10 bg-black/90 backdrop-blur p-1.5 shadow-xl">
						<input
							autoFocus
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search city..."
							className="w-full bg-white/[0.05] border border-white/10 rounded px-2 py-1 text-[12px] placeholder:text-white/30 focus:outline-none mb-1.5"
						/>
						<div className="max-h-[160px] overflow-y-auto">
							{matches.map((city) => (
								<button
									key={city.name}
									onClick={() => {
										onChange(city.name);
										setQuery("");
										setOpen(false);
									}}
									className="w-full flex items-center justify-between gap-2 rounded px-2 py-1 text-[12px] hover:bg-white/10 text-left"
								>
									<span className="truncate">{city.name}</span>
									<span className="text-[10px] text-white/35 shrink-0">
										{city.celsius}°C · {city.country}
									</span>
								</button>
							))}
						</div>
						<p className="px-2 pt-1.5 mt-1 border-t border-white/[0.07] text-[10px] text-white/25">
							Simulated data — no network request
						</p>
					</div>
				</>
			)}
		</div>
	);
}

export default function SettingsApp({ settings, updateSetting, wallpapersList }: SettingsAppProps) {
	const accentColors = [
		{ name: "Nook Lavender", hex: "#e8c5e5" },
		{ name: "Cyan Tech", hex: "#00F0FF" },
		{ name: "Sage Forest", hex: "#A4C3B2" },
		{ name: "Vibrant Amber", hex: "#FFB800" },
		{ name: "Nordic Crimson", hex: "#FF453A" }
	];

	const placedCount = settings.statusWidgets.left.length + settings.statusWidgets.right.length;

	return (
		<div className="flex flex-col h-full text-white/90 select-none text-sm font-sans">
			<div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
				{/* Wallpaper & Accents */}
				<Section title="Wallpaper & Accents">
					<div className="space-y-4 p-3">
						{wallpapersList.length > 1 && (
							<>
								<div>
									<label className="text-[12px] text-white/50 block mb-2">
										Desktop Wallpaper
									</label>
									<div className="grid grid-cols-4 gap-2">
										{wallpapersList.map((wp, idx) => (
											<button
												key={idx}
												onClick={() => updateSetting("wallpaper", idx)}
												className={`relative aspect-[16/10] rounded-md overflow-hidden border-2 transition-all ${
													settings.wallpaper === idx
														? "border-white scale-[0.98]"
														: "border-transparent opacity-60 hover:opacity-100 hover:scale-[1.02]"
												}`}
											>
												<div
													className="w-full h-full bg-cover bg-center"
													style={{ backgroundImage: `url(${wp})` }}
												/>
											</button>
										))}
									</div>
								</div>
								<div className="h-[1px] bg-white/5" />
							</>
						)}

						<div>
							<label className="text-[12px] text-white/50 block mb-2">System Accent</label>
							<div className="flex items-center gap-3">
								{accentColors.map((color) => (
									<button
										key={color.hex}
										onClick={() => updateSetting("accentColor", color.hex)}
										className={`w-6 h-6 rounded-full border-2 transition-all relative flex items-center justify-center ${
											settings.accentColor === color.hex
												? "border-white scale-[1.05] shadow-[0_0_10px_rgba(255,255,255,0.3)]"
												: "border-transparent opacity-60 hover:opacity-100"
										}`}
										style={{ backgroundColor: color.hex }}
										title={color.name}
									>
										{settings.accentColor === color.hex && (
											<span className="w-1.5 h-1.5 bg-black rounded-full" />
										)}
									</button>
								))}
							</div>
						</div>
					</div>
				</Section>

				{/* Notch */}
				<Section title="Notch">
					<div className="divide-y divide-white/5">
						<Row title="Notch Mode" description="Fixed stays open, Smart follows focus, Peek hides">
							<Select
								label="Notch Mode"
								value={settings.notchMode}
								onChange={(v) => updateSetting("notchMode", v)}
								options={[
									{ value: "fixed", label: "Fixed" },
									{ value: "smart", label: "Smart" },
									{ value: "peek", label: "Peek" }
								]}
							/>
						</Row>
						<Row title="Follow Active Monitor" description="Simulated — demo has a single display">
							<Toggle
								label="Follow Active Monitor"
								checked={settings.followActiveMonitor}
								onChange={(v) => updateSetting("followActiveMonitor", v)}
							/>
						</Row>
						<Row title="Always Over Fullscreen" description="Simulated — no fullscreen in browser">
							<Toggle
								label="Always Over Fullscreen"
								checked={settings.alwaysShowOverFullscreen}
								onChange={(v) => updateSetting("alwaysShowOverFullscreen", v)}
							/>
						</Row>
						<Row title="Calendar & Timer" description="Show the calendar peeks and running timer">
							<Toggle
								label="Calendar & Timer"
								checked={settings.calendarEnabled}
								onChange={(v) => updateSetting("calendarEnabled", v)}
							/>
						</Row>
						{settings.calendarEnabled && (
							<Row title="Timer Sound" description="Play a chime when the timer ends">
								<Toggle
									label="Timer Sound"
									checked={settings.timerSoundEnabled}
									onChange={(v) => updateSetting("timerSoundEnabled", v)}
								/>
							</Row>
						)}
					</div>
				</Section>

				{/* Music */}
				<Section title="Music Notch">
					<div className="divide-y divide-white/5">
						<Row title="Music Mode" description="Artwork, visualizer and transport controls">
							<Toggle
								label="Music Mode"
								checked={settings.musicModeEnabled}
								onChange={(v) => updateSetting("musicModeEnabled", v)}
							/>
						</Row>
						{settings.musicModeEnabled && (
							<>
								<Row title="Compact Notch" description="Show a single-line layout while playing">
									<Toggle
										label="Compact Notch"
										checked={settings.musicCompactNotch}
										onChange={(v) => updateSetting("musicCompactNotch", v)}
									/>
								</Row>
								<Row title="Media Layout" description="How the notch arranges track info">
									<Select
										label="Media Layout"
										value={settings.mediaLayout}
										onChange={(v) => updateSetting("mediaLayout", v)}
										options={[
											{ value: "classic", label: "Classic" },
											{ value: "compact", label: "Compact" }
										]}
									/>
								</Row>
								<Row title="Ambient Glow" description="Accent-tinted glow behind the island">
									<Toggle
										label="Ambient Glow"
										checked={settings.mediaAmbienceEnabled}
										onChange={(v) => updateSetting("mediaAmbienceEnabled", v)}
									/>
								</Row>
								{settings.mediaLayout === "compact" && (
									<Row title="Compact Glow" description="Stronger glow in the compact layout">
										<Toggle
											label="Compact Glow"
											checked={settings.mediaCompactGlowEnabled}
											onChange={(v) => updateSetting("mediaCompactGlowEnabled", v)}
										/>
									</Row>
								)}
							</>
						)}
					</div>
				</Section>

				{/* Weather */}
				<Section title="Weather">
					<div className="divide-y divide-white/5">
						<Row title="Weather Widget" description="Temperature and condition in the notch">
							<Toggle
								label="Weather Widget"
								checked={settings.weatherEnabled}
								onChange={(v) => updateSetting("weatherEnabled", v)}
							/>
						</Row>
						{settings.weatherEnabled && (
							<>
								<Row title="City" description="Pick a city to simulate">
									<CityPicker
										cityName={settings.cityName}
										onChange={(v) => updateSetting("cityName", v)}
									/>
								</Row>
								<Row title="Fahrenheit" description="Show temperatures in °F instead of °C">
									<Toggle
										label="Fahrenheit"
										checked={settings.tempUnitFahrenheit}
										onChange={(v) => updateSetting("tempUnitFahrenheit", v)}
									/>
								</Row>
							</>
						)}
					</div>
				</Section>

				{/* Status Widgets */}
				<Section title="Status Widgets">
					<div className="p-3 space-y-2.5">
						<StatusWidgetConfig
							value={settings.statusWidgets}
							onChange={(config) => updateSetting("statusWidgets", config)}
						/>
						<p className="text-[10px] text-white/30 leading-relaxed">
							Drag a chip into Left or Right to show it beside the clock (max 2 per side).
							{placedCount < WIDGET_DEFS.length &&
								" Unplaced chips sit in the pool below."}
						</p>
						<p className="text-[10px] text-white/25 leading-relaxed">
							Readings are simulated to match the desktop app's widget set.
						</p>
					</div>
				</Section>

				{/* Desktop Elements */}
				<Section title="Desktop Elements">
					<div className="divide-y divide-white/5">
						<Row title="Show Nook Dock" description="Display the custom application bar">
							<Toggle
								label="Show Nook Dock"
								checked={settings.isDockEnabled}
								onChange={(v) => updateSetting("isDockEnabled", v)}
							/>
						</Row>
						{settings.isDockEnabled && (
							<Row title="Dock Behavior" description="Choose auto-hide behavior">
								<Select
									label="Dock Behavior"
									value={settings.dockMode}
									onChange={(v) => updateSetting("dockMode", v)}
									options={[
										{ value: "fixed", label: "Fixed (Always On)" },
										{ value: "auto-hide", label: "Auto Hide" }
									]}
								/>
							</Row>
						)}
					</div>
				</Section>
			</div>

			<div className="px-5 py-3 border-t border-white/[0.05] bg-white/[0.01] flex justify-between items-center text-[10px] text-white/30">
				<span>Nook Simulation Website v1.0.0</span>
				<span>Made with React & Framer Motion</span>
			</div>
		</div>
	);
}
