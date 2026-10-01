import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
	console.error("Usage: bun run bump <major.minor.patch>");
	process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function updateJson(relativePath) {
	const path = resolve(root, relativePath);
	const json = JSON.parse(readFileSync(path, "utf8"));
	json.version = version;
	writeFileSync(path, JSON.stringify(json, null, 2) + "\n");
}

function updateCargoToml() {
	const path = resolve(root, "src-tauri/Cargo.toml");
	const content = readFileSync(path, "utf8");
	writeFileSync(path, content.replace(/^version = "[^"]*"/m, `version = "${version}"`));
}

function cargoPackageName() {
	const content = readFileSync(resolve(root, "src-tauri/Cargo.toml"), "utf8");
	const match = content.match(/^\[package\][\s\S]*?^name\s*=\s*"([^"]+)"/m);
	if (!match) throw new Error("Could not read [package] name from src-tauri/Cargo.toml");
	return match[1];
}

function updateCargoLock() {
	const path = resolve(root, "src-tauri/Cargo.lock");
	const content = readFileSync(path, "utf8");
	const name = cargoPackageName();
	writeFileSync(
		path,
		content.replace(
			new RegExp(`(\\[\\[package\\]\\]\\r?\\nname = "${name}"\\r?\\nversion = ")[^"]*(")`),
			`$1${version}$2`
		)
	);
}

updateJson("package.json");
updateJson("src-tauri/tauri.conf.json");
updateCargoToml();
updateCargoLock();

console.log(`Bumped package.json, tauri.conf.json, Cargo.toml and Cargo.lock to ${version}`);
