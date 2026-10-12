import { useEffect, useRef, useState, type CSSProperties } from "react";

export interface MediaInfo {
	title: string;
	artist: string;
	is_playing: boolean;
	has_media: boolean;
	artwork?: string[];
	position_ms?: number;
	duration_ms?: number;
	seek_enabled?: boolean;
	position_updated_at?: number;
}

const MARQUEE_SPEED = 30; // px/s — constant for all titles
const MARQUEE_MIN_DURATION = 5; // floor so short titles don't flicker

interface TitleMarqueeProps {
	title: string;
	variant?: "premium" | "compact";
}

export function TitleMarquee({ title, variant = "premium" }: TitleMarqueeProps) {
	const textRef = useRef<HTMLSpanElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [isOverflowing, setIsOverflowing] = useState(false);
	const [scrollDistance, setScrollDistance] = useState(0);
	const [scrollDuration, setScrollDuration] = useState(8);

	useEffect(() => {
		const check = () => {
			if (textRef.current && containerRef.current) {
				const textWidth = textRef.current.scrollWidth;
				const containerWidth = containerRef.current.clientWidth;
				const overflow = textWidth > containerWidth;
				setIsOverflowing(overflow);
				if (overflow) {
					const distance = textWidth - containerWidth;
					setScrollDistance(distance);
					setScrollDuration(Math.max(distance / MARQUEE_SPEED, MARQUEE_MIN_DURATION));
				}
			}
		};
		check();
		const observer = new ResizeObserver(check);
		if (containerRef.current) observer.observe(containerRef.current);
		return () => observer.disconnect();
	}, [title]);

	const compact = variant === "compact";

	return (
		<div
			ref={containerRef}
			className={compact ? "cmp-marquee-wrap" : "premium-title-wrap"}
			style={compact ? undefined : { width: "100%", overflow: "hidden" }}
		>
			<span
				ref={textRef}
				className={
					compact
						? `cmp-title ${isOverflowing ? "cmp-marquee" : ""}`
						: `premium-title ${isOverflowing ? "marquee" : ""}`
				}
				style={
					{
						"--scroll-distance": isOverflowing ? `-${scrollDistance}px` : undefined,
						"--scroll-duration": `${scrollDuration}s`
					} as CSSProperties
				}
			>
				{title}
			</span>
		</div>
	);
}
