import {
	WifiIcon,
	DockIcon,
	BluetoothIcon,
	NotchIcon,
	MoonIcon,
	BatterySaverIcon,
	TrayIcon,
	BellIcon,
	SettingsIcon,
	ReloadIcon,
	BrightnessLowIcon,
	VolumeLowIcon
} from "../icons";

interface QuickSettingsPanelProps {
	wifiEnabled: boolean;
	onToggleWifi: () => void;
	onWifiContextMenu: (e: React.MouseEvent) => void | Promise<void>;
	dockMode: string;
	onCycleDockMode: (e: React.MouseEvent) => void | Promise<void>;
	bluetoothEnabled: boolean;
	onToggleBluetooth: () => void;
	onBluetoothContextMenu: (e: React.MouseEvent) => void | Promise<void>;
	notchMode: string;
	onCycleNotchMode: (e: React.MouseEvent) => void | Promise<void>;
	dndActive: boolean;
	onToggleDnd: () => void;
	batterySaverEnabled: boolean;
	onOpenBatterySaver: () => void;
	onOpenSystemTray: (e: React.MouseEvent) => void;
	onOpenNotificationCenter: () => void;
	onOpenSettings: () => void;
	onRestart: () => void;
	volume: number;
	onVolumeChange: (value: number) => void;
	brightness: number;
	onBrightnessChange: (value: number) => void;
}

const dockModeLabel = (mode: string) =>
	mode === "fixed" ? "Fixed" : mode === "smart" ? "Smart" : "Peek";

export function QuickSettingsPanel({
	wifiEnabled,
	onToggleWifi,
	onWifiContextMenu,
	dockMode,
	onCycleDockMode,
	bluetoothEnabled,
	onToggleBluetooth,
	onBluetoothContextMenu,
	notchMode,
	onCycleNotchMode,
	dndActive,
	onToggleDnd,
	batterySaverEnabled,
	onOpenBatterySaver,
	onOpenSystemTray,
	onOpenNotificationCenter,
	onOpenSettings,
	onRestart,
	volume,
	onVolumeChange,
	brightness,
	onBrightnessChange
}: QuickSettingsPanelProps) {
	return (
		<>
			{/* Pills Grid */}
			<div className="cc-pills-grid">
				{/* Wi-Fi Pill */}
				<div
					className={`cc-pill-tile ${wifiEnabled ? "active" : ""}`}
					onClick={(e) => {
						e.stopPropagation();
						onToggleWifi();
					}}
					onContextMenu={onWifiContextMenu}
					title="Left-click to toggle, Right-click for Settings"
				>
					<div className="cc-pill-icon-wrapper">
						<WifiIcon connected={wifiEnabled} />
					</div>
					<div className="cc-pill-info">
						<span className="cc-pill-title">Wi-Fi</span>
						<span className="cc-pill-status">{wifiEnabled ? "Connected" : "Off"}</span>
					</div>
				</div>

				{/* Dock Mode Pill */}
				<div
					className={`cc-pill-tile ${dockMode === "fixed" ? "active" : ""}`}
					onClick={(e) => {
						e.stopPropagation();
						onCycleDockMode(e);
					}}
					title="Cycle dock mode: Fixed / Smart / Peek"
				>
					<div className="cc-pill-icon-wrapper">
						<DockIcon />
					</div>
					<div className="cc-pill-info">
						<span className="cc-pill-title">Dock Mode</span>
						<span className="cc-pill-status">{dockModeLabel(dockMode)}</span>
					</div>
				</div>

				{/* Bluetooth Pill */}
				<div
					className={`cc-pill-tile ${bluetoothEnabled ? "active" : ""}`}
					onClick={(e) => {
						e.stopPropagation();
						onToggleBluetooth();
					}}
					onContextMenu={onBluetoothContextMenu}
					title="Left-click to toggle, Right-click for Settings"
				>
					<div className="cc-pill-icon-wrapper">
						<BluetoothIcon />
					</div>
					<div className="cc-pill-info">
						<span className="cc-pill-title">Bluetooth</span>
						<span className="cc-pill-status">{bluetoothEnabled ? "On" : "Off"}</span>
					</div>
				</div>

				{/* Notch Mode Pill */}
				<div
					className={`cc-pill-tile ${notchMode === "fixed" ? "active" : ""}`}
					onClick={(e) => {
						e.stopPropagation();
						onCycleNotchMode(e);
					}}
					title="Cycle notch mode: Fixed / Smart / Peek"
				>
					<div className="cc-pill-icon-wrapper">
						<NotchIcon />
					</div>
					<div className="cc-pill-info">
						<span className="cc-pill-title">Notch Mode</span>
						<span className="cc-pill-status">{dockModeLabel(notchMode)}</span>
					</div>
				</div>
			</div>

			{/* Circular Actions Row */}
			<div className="cc-circular-actions-row">
				<button
					className={`cc-circular-btn ${dndActive ? "active" : ""}`}
					onClick={(e) => {
						e.stopPropagation();
						onToggleDnd();
					}}
					title={`Focus / DND: ${dndActive ? "On" : "Off"}`}
				>
					<MoonIcon />
				</button>
				<button
					className={`cc-circular-btn ${batterySaverEnabled ? "active" : ""}`}
					onClick={(e) => {
						e.stopPropagation();
						onOpenBatterySaver();
					}}
					title={`Energy Saver: ${batterySaverEnabled ? "On" : "Off"} — Click to open Settings`}
				>
					<BatterySaverIcon />
				</button>
				<button
					className="cc-circular-btn"
					onClick={(e) => {
						e.stopPropagation();
						onOpenSystemTray(e);
					}}
					title="System Tray"
				>
					<TrayIcon />
				</button>
				<button
					className="cc-circular-btn"
					onClick={(e) => {
						e.stopPropagation();
						onOpenNotificationCenter();
					}}
					title="Notification Center"
				>
					<BellIcon />
				</button>
				<button
					className="cc-circular-btn"
					onClick={(e) => {
						e.stopPropagation();
						onOpenSettings();
					}}
					title="Nook Settings"
				>
					<SettingsIcon />
				</button>
				<button
					className="cc-circular-btn"
					onClick={(e) => {
						e.stopPropagation();
						onRestart();
					}}
					title="Restart Nook"
				>
					<ReloadIcon />
				</button>
			</div>

			{/* Classic Sliders Area */}
			<div className="cc-classic-sliders-area">
				{/* Volume Slider */}
				<div className="cc-classic-slider-row">
					<div className="cc-classic-slider-label">
						<VolumeLowIcon style={{ opacity: 0.5 }} />
						<span>Volume</span>
					</div>
					<div className="cc-classic-slider-track">
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={volume}
							onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
							onPointerDown={(e) => e.stopPropagation()}
							onClick={(e) => e.stopPropagation()}
							className="cc-classic-input"
						/>
						<div className="cc-classic-fill" style={{ width: `${volume * 100}%` }} />
					</div>
					<span className="cc-classic-percentage">{Math.round(volume * 100)}%</span>
				</div>

				{/* Brightness Slider */}
				<div className="cc-classic-slider-row">
					<div className="cc-classic-slider-label">
						<BrightnessLowIcon />
						<span>Brightness</span>
					</div>
					<div className="cc-classic-slider-track">
						<input
							type="range"
							min="0"
							max="100"
							step="1"
							value={brightness}
							onChange={(e) => onBrightnessChange(parseInt(e.target.value))}
							onPointerDown={(e) => e.stopPropagation()}
							onClick={(e) => e.stopPropagation()}
							className="cc-classic-input"
						/>
						<div className="cc-classic-fill" style={{ width: `${brightness}%` }} />
					</div>
					<span className="cc-classic-percentage">{brightness}%</span>
				</div>
			</div>
		</>
	);
}
