import { useCallback, useEffect, useRef } from "react";

export function useTrailingThrottle<Args extends unknown[]>(
	callback: (...args: Args) => void,
	intervalMs: number
) {
	const callbackRef = useRef(callback);
	callbackRef.current = callback;
	const lastCall = useRef(0);
	const pending = useRef<Args | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(
		() => () => {
			if (timer.current !== null) clearTimeout(timer.current);
		},
		[]
	);
	return useCallback(
		(...args: Args) => {
			pending.current = args;
			const elapsed = performance.now() - lastCall.current;
			const send = () => {
				timer.current = null;
				const latest = pending.current;
				pending.current = null;
				if (latest) {
					lastCall.current = performance.now();
					callbackRef.current(...latest);
				}
			};
			if (elapsed >= intervalMs) {
				if (timer.current !== null) clearTimeout(timer.current);
				send();
			} else if (timer.current === null) timer.current = setTimeout(send, intervalMs - elapsed);
		},
		[intervalMs]
	);
}
