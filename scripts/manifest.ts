import fs from "fs";
import { resolve } from "path";
import { PluginOption, ResolvedConfig } from "vite";

// the plugin should only work if you're building for KaiOS
const production = process.env.NODE_ENV === "production";

export default function kaiManifest({ isKai3 = false, manifest = {} }: any): PluginOption {
	let config: ResolvedConfig;

	const asmFiles: string[] = [];
	const wasmFiles: string[] = [];
	const memFiles: string[] = [];

	if (production)
		return {
			name: "kai-manifest",

			configResolved(_config) {
				config = _config;
			},

			async writeBundle() {
				const manifestFileName = isKai3 ? "manifest.webmanifest" : "manifest.webapp";

				const distFolder = resolve(config.root, config.build.outDir);
				const buildsFolder = resolve(config.root, "builds", manifestFileName);

				fs.existsSync(distFolder) || fs.mkdirSync(distFolder);

				const manifestFilePath = resolve(config.root, config.build.outDir, manifestFileName);

				if (isKai3) {
					asmFiles.forEach((a) => {
						fs.rmSync(resolve(distFolder, a));
					});

					memFiles.forEach((a) => {
						fs.rmSync(resolve(distFolder, a));
					});
				} else {
					manifest.precompile = asmFiles;

					wasmFiles.forEach((a) => {
						fs.rmSync(resolve(distFolder, a));
					});
				}

				fs.writeFileSync(manifestFilePath, JSON.stringify(manifest));
				await Bun.write(buildsFolder, JSON.stringify(manifest));
			},

			generateBundle(options, bundle) {
				// console.log("GENERATE BUNDLE");
				for (const fileName in bundle) {
					if (fileName.endsWith(".wasm")) {
						wasmFiles.push(fileName);
					}

					if (fileName.endsWith(".mem")) {
						memFiles.push(fileName);
					}

					if (fileName.endsWith(".js")) {
						if (fileName.includes("asm")) {
							asmFiles.push(fileName);
						}
					}
				}
			},
		};
}
