import {
	ArrowUpDown,
	BatteryFull,
	CloudSun,
	Cpu,
	HardDrive,
	MemoryStick
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export interface WidgetConfig {
	left: string[];
	right: string[];
}

export interface WidgetDef {
	id: string;
	label: string;
	icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;
	color: string;
}

export const WIDGET_DEFS: WidgetDef[] = [
	{ id: "weather", label: "Weather", icon: CloudSun, color: "#60a5fa" },
	{ id: "battery", label: "Battery", icon: BatteryFull, color: "#4ade80" },
	{ id: "cpu", label: "CPU", icon: Cpu, color: "#f97316" },
	{ id: "ram", label: "RAM", icon: MemoryStick, color: "#a78bfa" },
	{ id: "disk", label: "Disk", icon: HardDrive, color: "#38bdf8" },
	{ id: "net", label: "Net", icon: ArrowUpDown, color: "#2dd4bf" }
];

export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
	left: ["weather"],
	right: ["battery"]
};

export const MAX_PER_ZONE = 2;

export function widgetDef(id: string): WidgetDef {
	return WIDGET_DEFS.find((w) => w.id === id) ?? WIDGET_DEFS[0];
}
