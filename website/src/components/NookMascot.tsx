import { Mascot } from "page-mascot";
import { useEffect, useId, useRef, useState } from "react";
import { Info, Music2, Settings, Sparkles, History, Activity, Terminal, Globe } from "lucide-react";

const WINDOWS = [
	{ id: "about", label: "About Nook", icon: Info },
	{ id: "music", label: "Music", icon: Music2 },
	{ id: "settings", label: "Settings", icon: Settings },
	{ id: "features", label: "Features", icon: Sparkles },
	{ id: "changelog", label: "What's new", icon: History },
	{ id: "performance", label: "Performance", icon: Activity },
	{ id: "terminal", label: "Terminal", icon: Terminal },
	{ id: "browser", label: "Browser", icon: Globe }
];

const sprites = import.meta.glob<string>("../assets/mascots/nook-*.webp", {
	eager: true,
	query: "?url",
	import: "default"
});

export default function NookMascot({ onOpenApp, openApps }: { onOpenApp: (id: string) => void; openApps: string[] }) {
	const [menuOpen, setMenuOpen] = useState(false);
	const containerRef = useRef<HTMLElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const menuId = useId();
	useEffect(() => {
		const button = containerRef.current?.querySelector(".nook-mascot-character button");
		button?.setAttribute("aria-label", "Open Nook windows");
		button?.setAttribute("aria-haspopup", "menu");
		button?.setAttribute("aria-expanded", String(menuOpen));
		button?.setAttribute("aria-controls", menuId);
		if (!menuOpen) return;
		const frame = requestAnimationFrame(() => menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus());
		const dismiss = (event: PointerEvent) => { if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setMenuOpen(false); };
		const escape = (event: KeyboardEvent) => {
			if (event.key === "Escape") { event.preventDefault(); setMenuOpen(false); (button as HTMLButtonElement | null)?.focus(); }
		};
		document.addEventListener("pointerdown", dismiss);
		document.addEventListener("keydown", escape);
		return () => { cancelAnimationFrame(frame); document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
	}, [menuOpen, menuId]);
	const directions = sprites["../assets/mascots/nook-directions.webp"];
	const reactions = sprites["../assets/mascots/nook-reactions.webp"];
	return (
		<aside ref={containerRef} className="nook-mascot" aria-label="Nook window launcher">
			{menuOpen && <div ref={menuRef} id={menuId} className="nook-mascot-menu" role="menu" aria-label="Open a window" onKeyDown={(event) => {
				const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("button") || []);
				const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
				let next: number | null = null;
				if (event.key === "ArrowDown") next = (index + 1) % buttons.length;
				if (event.key === "ArrowUp") next = (index - 1 + buttons.length) % buttons.length;
				if (event.key === "Home") next = 0;
				if (event.key === "End") next = buttons.length - 1;
				if (event.key === "Tab") setMenuOpen(false);
				if (next !== null) { event.preventDefault(); buttons[next]?.focus(); }
			}}>
				<div className="nook-mascot-menu-title">Open a window</div>
				{WINDOWS.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="menuitem" onClick={() => { onOpenApp(id); setMenuOpen(false); }}><Icon size={16} aria-hidden="true" /><span>{label}</span>{openApps.includes(id) && <span className="nook-window-open" aria-label="Already open" />}</button>)}
			</div>}
			<div className="nook-mascot-character" onClick={() => setMenuOpen(open => !open)}>
			{directions && reactions ? (
				<Mascot directions={directions} reactions={reactions} size={112} label="Nook mascot" />
			) : (
				<button type="button" className="nook-mascot-placeholder" aria-label="Open Nook windows" title="Open Nook windows">
					<img src="/nook.png" alt="" width={112} height={112} />
				</button>
			)}
			</div>
		</aside>
	);
}
