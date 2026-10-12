import { useState, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";

export interface MailSummary {
	unread: number;
	subject: string;
	from: string;
	has_more: boolean;
	updated_at: number;
	messages?: { uid: number; subject: string; from: string }[];
}

const CACHE_KEY = "nook-mail-cache";

function readCache(): MailSummary | null {
	try {
		const raw = localStorage.getItem(CACHE_KEY);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

/**
 * Listens to `mail-updated` (summary changed) and `mail-arrived` (new mail
 * detected — always re-fires even when the summary text is unchanged).
 * The latest summary is cached in localStorage.
 *
 * @param enabled - Mirrors `nook-mail-enabled`; listeners only run when true.
 * @param onArrive - Called when a new mail arrives (used to trigger the peek).
 */
export function useMail(enabled: boolean, onArrive?: (summary: MailSummary) => void) {
	const [mail, setMail] = useState<MailSummary | null>(() => readCache());
	const onArriveRef = useRef(onArrive);
	onArriveRef.current = onArrive;

	useEffect(() => {
		if (!enabled) return;

		const apply = (summary: MailSummary) => {
			setMail(summary);
			try {
				localStorage.setItem(CACHE_KEY, JSON.stringify(summary));
			} catch {}
		};

		const unlistenUpdated = listen<MailSummary>("mail-updated", (event) => {
			apply(event.payload);
		});

		const unlistenArrived = listen<MailSummary>("mail-arrived", (event) => {
			apply(event.payload);
			onArriveRef.current?.(event.payload);
		});

		return () => {
			unlistenUpdated.then((fn) => fn());
			unlistenArrived.then((fn) => fn());
		};
	}, [enabled]);

	return { mail };
}
