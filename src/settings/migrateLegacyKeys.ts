/**
 * One-time migration from the pre-4.1.0 `bloom-*` localStorage keys to `nook-*`.
 *
 * The rename also changed the bundle identifier, so the WebView2 profile was
 * copied to a fresh directory. The keys inside it still carry the old prefix,
 * so they are rewritten here instead of resetting every preference.
 *
 * settings.json is migrated by the Rust side in init_settings_cache, which
 * runs during setup() before any get_setting_str call. This module only owns
 * localStorage, and it has to run synchronously on module load because several
 * useState initializers read localStorage during the very first render.
 */

const LEGACY_PREFIX = "bloom-";
const CURRENT_PREFIX = "nook-";

export function migrateLegacyLocalStorage() {
	try {
		const stale: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key || !key.startsWith(LEGACY_PREFIX)) continue;
			const value = localStorage.getItem(key);
			if (value === null) continue;
			const next = CURRENT_PREFIX + key.slice(LEGACY_PREFIX.length);
			if (localStorage.getItem(next) === null) localStorage.setItem(next, value);
			stale.push(key);
		}
		for (const key of stale) localStorage.removeItem(key);
	} catch (err) {
		console.error("legacy localStorage migration failed", err);
	}
}

migrateLegacyLocalStorage();
