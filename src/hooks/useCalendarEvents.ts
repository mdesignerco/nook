import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

export interface CalendarEventItem {
	date: string;
	title: string;
	start?: string | null;
	all_day?: boolean;
}

interface CalendarEventsPayload {
	events: CalendarEventItem[];
	updated_at: number;
}

const CACHE_KEY = "nook-calendar-cache";

function readCache(): CalendarEventItem[] {
	try {
		const raw = localStorage.getItem(CACHE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) {
			return parsed.filter((e) => e && typeof e.date === "string" && typeof e.title === "string");
		}
	} catch {}
	return [];
}

/**
 * Receives calendar events emitted by the backend poller (`test_ical_url` and
 * `spawn_calendar_poller`). The latest payload is cached in localStorage so the
 * dots survive an app restart before the next poll lands.
 *
 * @param enabled - Mirrors `nook-calendar-sync-enabled`; listeners only run when true.
 */
export function useCalendarEvents(enabled: boolean) {
	const [events, setEvents] = useState<CalendarEventItem[]>(() => readCache());

	useEffect(() => {
		if (!enabled) return;

		const unlisten = listen<CalendarEventsPayload>("calendar-events-updated", (event) => {
			const evts = Array.isArray(event.payload?.events) ? event.payload.events : [];
			setEvents(evts);
			try {
				localStorage.setItem(CACHE_KEY, JSON.stringify(evts));
			} catch {}
		});

		return () => {
			unlisten.then((fn) => fn());
		};
	}, [enabled]);

	return { events };
}
