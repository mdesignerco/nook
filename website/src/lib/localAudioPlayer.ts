import type { YouTubePlayer } from "./youtube";

export type LocalPlaybackState = "playing" | "paused" | "ended";

export interface LocalAudioPlayerCallbacks {
	onStateChange?: (state: LocalPlaybackState) => void;
	onBlocked?: () => void;
	onError?: () => void;
}

export function localTrackKey(trackId: string): string {
	return `local:${trackId}`;
}

export class LocalAudioPlayer implements YouTubePlayer {
	private readonly audio: HTMLAudioElement;
	private readonly resolve: (key: string) => string | undefined;
	private readonly callbacks: LocalAudioPlayerCallbacks;
	private sourceKey = "";
	private startSeconds = 0;
	private disposed = false;

	constructor(resolve: (key: string) => string | undefined, callbacks: LocalAudioPlayerCallbacks = {}) {
		this.resolve = resolve;
		this.callbacks = callbacks;
		this.audio = new Audio();
		this.audio.preload = "auto";
		this.audio.addEventListener("play", () => {
			if (!this.disposed) this.callbacks.onStateChange?.("playing");
		});
		this.audio.addEventListener("pause", () => {
			if (!this.disposed && !this.audio.ended) this.callbacks.onStateChange?.("paused");
		});
		this.audio.addEventListener("ended", () => {
			if (!this.disposed) this.callbacks.onStateChange?.("ended");
		});
		this.audio.addEventListener("error", () => {
			if (!this.disposed) this.callbacks.onError?.();
		});
	}

	private applyStartTime = () => {
		const duration = this.audio.duration;
		if (this.startSeconds > 0 && Number.isFinite(duration)) {
			this.audio.currentTime = Math.min(this.startSeconds, duration);
		}
	};

	private attach = (key: string, src: string, startSeconds: number, autoplay: boolean) => {
		this.startSeconds = startSeconds;
		if (key !== this.sourceKey) {
			this.sourceKey = key;
			this.audio.src = src;
			this.audio.load();
			this.audio.addEventListener("loadedmetadata", this.applyStartTime, { once: true });
		} else {
			this.applyStartTime();
		}
		if (autoplay) this.playVideo();
		else this.pauseVideo();
	};

	private setSrc(key: string, startSeconds: number | undefined, autoplay: boolean) {
		const src = this.resolve(key);
		if (!src) {
			this.callbacks.onError?.();
			return;
		}
		this.attach(key, src, startSeconds ?? 0, autoplay);
	}

	playVideo(): void {
		if (this.disposed) return;
		void this.audio.play().catch((error: unknown) => {
			if (this.disposed) return;
			if (error instanceof DOMException && error.name === "NotAllowedError") {
				this.callbacks.onBlocked?.();
				return;
			}
			this.callbacks.onError?.();
		});
	}

	pauseVideo(): void {
		if (this.disposed) return;
		this.audio.pause();
	}

	seekTo(seconds: number): void {
		if (this.disposed) return;
		const duration = this.audio.duration;
		const target = Number.isFinite(duration) ? Math.min(seconds, duration) : seconds;
		this.audio.currentTime = Math.max(0, target);
	}

	getCurrentTime(): number {
		return this.disposed ? 0 : this.audio.currentTime;
	}

	getDuration(): number {
		if (this.disposed) return 0;
		return Number.isFinite(this.audio.duration) ? this.audio.duration : 0;
	}

	setVolume(volume: number): void {
		if (this.disposed) return;
		this.audio.volume = Math.min(1, Math.max(0, volume / 100));
	}

	mute(): void {
		if (this.disposed) return;
		this.audio.muted = true;
	}

	unMute(): void {
		if (this.disposed) return;
		this.audio.muted = false;
	}

	loadVideoById(options: { videoId: string; startSeconds?: number }): void {
		this.setSrc(options.videoId, options.startSeconds, true);
	}

	cueVideoById(options: { videoId: string; startSeconds?: number }): void {
		this.setSrc(options.videoId, options.startSeconds, false);
	}

	destroy(): void {
		if (this.disposed) return;
		this.disposed = true;
		this.audio.removeEventListener("loadedmetadata", this.applyStartTime);
		this.audio.pause();
		this.audio.removeAttribute("src");
		this.audio.load();
	}
}
