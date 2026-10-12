import { useRef, useState } from "react";
import { ExternalLink, Lock, RotateCcw, Play, Globe } from "lucide-react";
import { NOOK_VIDEO_URL, YOUTUBE_CHANNEL_URL } from "../../lib/demoMedia";

function Youtube({ size, className }: { size: number; className?: string }) {
	return <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="5" fill="currentColor" /><path d="m10 8 6 4-6 4Z" fill="#121820" /></svg>;
}

function youtubeEmbed(raw: string): string | null {
	try {
		const url = new URL(raw);
		if (url.protocol !== "https:") return null;
		const host = url.hostname.replace(/^www\./, "");
		let id: string | null = null;
		if (host === "youtu.be") id = url.pathname.slice(1);
		if (host === "youtube.com" || host === "youtube-nocookie.com") {
			id = url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)$/)?.[1] || null;
		}
		return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
	} catch {
		return null;
	}
}

export default function BrowserApp() {
	const [activeTab, setActiveTab] = useState<"channel" | "nook">("channel");
	const [refreshKey, setRefreshKey] = useState(0);
	const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
	const videoEmbed = youtubeEmbed(NOOK_VIDEO_URL);
	const targetUrl = activeTab === "channel" ? YOUTUBE_CHANNEL_URL : videoEmbed ? NOOK_VIDEO_URL : "";
	const tabs = [{ id: "channel" as const, title: "@mdesigner_co" }, { id: "nook" as const, title: "Nook video" }];
	return (
		<div className="h-full w-full flex bg-black/20 select-none font-sans overflow-hidden text-white">
			<div role="tablist" aria-label="YouTube tabs" aria-orientation="vertical" className="w-[42px] shrink-0 flex flex-col items-center py-2 gap-1 bg-white/[0.02] border-r border-white/[0.05]">
				{tabs.map((tab, index) => <button key={tab.id} ref={element => { tabRefs.current[index] = element; }} id={`youtube-tab-${tab.id}`} role="tab" type="button" aria-selected={activeTab === tab.id} aria-controls="youtube-panel" tabIndex={activeTab === tab.id ? 0 : -1} onClick={() => setActiveTab(tab.id)} onKeyDown={event => {
					if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); const next = (index + 1) % tabs.length; setActiveTab(tabs[next].id); tabRefs.current[next]?.focus(); }
				}} title={tab.title} aria-label={tab.title} className="relative group focus-visible:outline-2 focus-visible:outline-[#d68b26]"><div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${activeTab === tab.id ? "bg-white/[0.08] text-white/70" : "text-white/25 hover:text-white/50 hover:bg-white/[0.04]"}`}><Globe size={13} aria-hidden="true" /></div>{activeTab === tab.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3 rounded-r bg-white/50" />}</button>)}
			</div>
			<div className="flex-1 flex flex-col min-w-0">
			<div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.02] border-b border-white/[0.05]">
				<button type="button" onClick={() => setRefreshKey(key => key + 1)} aria-label="Reload video" disabled={!videoEmbed || activeTab !== "nook"} className="w-6 h-6 flex items-center justify-center rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.06] disabled:opacity-20"><RotateCcw size={10} /></button>
				<div className="flex-1 flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1 ml-1"><Lock size={9} className="text-white/25 shrink-0" /><input aria-label="Current address" readOnly value={targetUrl || "Nook product video — coming soon"} className="flex-1 bg-transparent text-[10px] text-white/70 font-mono outline-none min-w-0" />{targetUrl && <a href={targetUrl} target="_blank" rel="noopener noreferrer" aria-label="Open on YouTube" className="text-white/30 hover:text-white/60 transition-colors shrink-0"><ExternalLink size={9} /></a>}</div>
			</div>
			<div id="youtube-panel" role="tabpanel" aria-labelledby={`youtube-tab-${activeTab}`} className="flex-1 relative min-h-0 overflow-auto bg-[#1a1a24]">
				{activeTab === "channel" ? (
					<div className="h-full flex flex-col items-center justify-center text-center px-8 py-6 gap-4">
						<Youtube size={42} className="text-red-400" aria-hidden="true" />
						<div><h2 className="text-xl font-semibold">mdesigner</h2><p className="text-sm text-white/50 mt-1">@mdesigner_co</p></div>
						<p className="text-xs leading-relaxed text-white/65 max-w-xs">Visit our channel on YouTube. Channel pages cannot be displayed inside the demo browser.</p>
						<a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-white/60 hover:bg-white/[0.1]">Open YouTube channel <ExternalLink size={13} /></a>
					</div>
				) : videoEmbed ? (
					<iframe key={refreshKey} title="Nook product video" src={videoEmbed} className="w-full h-full border-0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
				) : (
					<div className="h-full flex flex-col items-center justify-center text-center px-8 py-6 gap-4"><img src="/nook.png" alt="" width={64} height={64} /><h2 className="text-xl font-semibold">Nook product demo</h2><p className="text-xs text-white/65 leading-relaxed max-w-xs">Our Nook video will appear here once its YouTube link is added.</p><span className="inline-flex items-center gap-2 text-xs text-[#d68b26]"><Play size={14} />Coming soon</span></div>
				)}
			</div>
			</div>
		</div>
	);
}
