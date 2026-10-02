import { useEffect, useRef, useState } from "react";

export interface SystemTelemetry {
	batteryLevel: number;
	isCharging: boolean;
	lowBatteryThreshold: number;
	cpuUsage: number;
	ramUsage: number;
	diskSpaceGB: number;
	netUpSpeed: number;
	netDownSpeed: number;
}

export const LOW_BATTERY_THRESHOLD = 20;

const START_BATTERY = 62;
const DISK_TOTAL_GB = 512;
const TICK_MS = 3_000;

/**
 * The desktop app samples the real machine through Tauri commands. A browser
 * page has no equivalent, so the demo runs the same shape of data off a small
 * simulator: the battery drains and recharges, CPU and RAM wander, and network
 * traffic arrives in bursts. Values are only ever plausible, never real.
 */
export function useSimulatedSystem(): SystemTelemetry {
	const [state, setState] = useState<SystemTelemetry>(() => ({
		batteryLevel: START_BATTERY,
		isCharging: false,
		lowBatteryThreshold: LOW_BATTERY_THRESHOLD,
		cpuUsage: 14,
		ramUsage: 38,
		diskSpaceGB: 284,
		netUpSpeed: 0,
		netDownSpeed: 0
	}));

	const netBurstRef = useRef(0);

	useEffect(() => {
		const id = window.setInterval(() => {
			setState((prev) => {
				const drain = prev.isCharging ? 1 : -1;
				let batteryLevel = prev.batteryLevel + drain;
				let isCharging = prev.isCharging;

				// Flip direction at the ends so the indicator never sits pinned.
				if (batteryLevel >= 100) {
					batteryLevel = 100;
					isCharging = false;
				} else if (batteryLevel <= 5) {
					batteryLevel = 5;
					isCharging = true;
				}

				// Ease each reading toward a fresh random target.
				const drift = (value: number, low: number, high: number) => {
					const target = low + Math.random() * (high - low);
					return Math.round(value + (target - value) * 0.35);
				};

				netBurstRef.current -= TICK_MS;
				let netDownSpeed = 0;
				let netUpSpeed = 0;
				if (netBurstRef.current <= 0) {
					netBurstRef.current = 9_000 + Math.random() * 26_000;
					netDownSpeed = 180_000 + Math.random() * 3_400_000;
					netUpSpeed = 20_000 + Math.random() * 260_000;
				}

				return {
					...prev,
					batteryLevel,
					isCharging,
					cpuUsage: drift(prev.cpuUsage, 4, 68),
					ramUsage: drift(prev.ramUsage, 26, 72),
					netDownSpeed: Math.round(netDownSpeed),
					netUpSpeed: Math.round(netUpSpeed)
				};
			});
		}, TICK_MS);

		return () => window.clearInterval(id);
	}, []);

	return state;
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
	return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}

export { DISK_TOTAL_GB };
