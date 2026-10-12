import { Mascot } from "page-mascot";

const sprites = import.meta.glob<string>("../assets/mascots/nook-*.webp", {
	eager: true,
	query: "?url",
	import: "default"
});

export default function NookMascot({ onOpenAbout }: { onOpenAbout: () => void }) {
	const directions = sprites["../assets/mascots/nook-directions.webp"];
	const reactions = sprites["../assets/mascots/nook-reactions.webp"];
	return (
		<aside className="nook-mascot" aria-label="Nook mascot">
			{directions && reactions ? (
				<Mascot directions={directions} reactions={reactions} size={112} label="Nook mascot" />
			) : (
				<button type="button" className="nook-mascot-placeholder" onClick={onOpenAbout} aria-label="About Nook" title="About Nook">
					<img src="/nook.png" alt="" width={112} height={112} />
				</button>
			)}
		</aside>
	);
}
