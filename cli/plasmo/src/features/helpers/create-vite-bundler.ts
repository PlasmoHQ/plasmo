import { dirname, join, resolve } from "path"
import { emptyDir, ensureDir, exists, readJson, writeJson } from "fs-extra"
import type { PlasmoManifest } from "~features/manifest-factory/base"

import { getFlag, hasFlag } from "@plasmo/utils/flags"
import { iLog, wLog } from "@plasmo/utils/logging"

import { setInternalEnv } from "~features/env/env-config"
import { getPackageManager } from "./package-manager"
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import type { UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

const PackageInstallerMap = {
    npm: 'npm',
    yarn: 'yarn',
    pnpm: 'pnpm'
}

export const createViteBuilder = async (
    { commonPath, bundleConfig, publicEnv }: PlasmoManifest,
    { ...options }: UserConfig
) => {
    const isProd = options.mode === "production"

    if (isProd) {
        await emptyDir(commonPath.distDirectory)
    } else {
        await ensureDir(commonPath.distDirectory)
    }

    process.env.__PLASMO_FRAMEWORK_INTERNAL_NO_MINIFY =
        isProd && hasFlag("--no-minify") ? "true" : "false"

    process.env.__PLASMO_FRAMEWORK_INTERNAL_SOURCE_MAPS = isProd
        ? hasFlag("--inline-source-maps")
            ? "inline"
            : hasFlag("--source-maps")
                ? "external"
                : "none"
        : hasFlag("--no-source-maps")
            ? "none"
            : "inline"

    process.env.__PLASMO_FRAMEWORK_INTERNAL_NO_CS_RELOAD = hasFlag(
        "--no-cs-reload"
    )
        ? "true"
        : "false"

    process.env.__PLASMO_FRAMEWORK_INTERNAL_ES_TARGET =
        (getFlag("--es-target") as any) || "es2022"

    const pmInfo = await getPackageManager()

    const baseConfig = require.resolve("@plasmohq/parcel-config")
    let runConfig = join(dirname(baseConfig), "run.json")

    const configJson = await readJson(baseConfig)

    if (hasFlag("--bundle-buddy")) {
        configJson.reporters = ["...", "@parcel/reporter-bundle-buddy"]
    }

    await writeJson(runConfig, configJson)

    if (await exists(commonPath.parcelConfig)) {
        runConfig = commonPath.parcelConfig

        if (isProd) {
            const customConfig = await readJson(runConfig)

            if (customConfig.extends !== "@plasmohq/parcel-config") {
                wLog(
                    'The .parcelrc does not extend "@plasmohq/parcel-config", the result may be unexpected'
                )
            }
        }

        if (hasFlag("--bundle-buddy")) {
            wLog(
                'The "--bundle-buddy" flag does not work with a custom .parcelrc file'
            )
        }
    }

    const engines = {
        browsers:
            bundleConfig.manifestVersion === "mv2" &&
                bundleConfig.browser !== "firefox"
                ? ["IE 11"]
                : ["last 1 Chrome version"]
    }

    setInternalEnv(bundleConfig)

    console.log("commonPath:", commonPath)

    const __dirname = dirname(fileURLToPath(import.meta.url))

    const config = defineConfig({
        root: commonPath.dotPlasmoDirectory,
        cacheDir: resolve(commonPath.cacheDirectory, "vite"),
        build: {
            outDir: commonPath.distDirectory,
            sourcemap: process.env.__PLASMO_FRAMEWORK_INTERNAL_SOURCE_MAPS !== "none",
            target: process.env.__PLASMO_FRAMEWORK_INTERNAL_ES_TARGET,
            minify: process.env.__PLASMO_FRAMEWORK_INTERNAL_NO_MINIFY === "false",
            manifest: true, // Generate a manifest file similar to Parcel
            emptyOutDir: true,
            // Specify the entry points for your extension
            rollupOptions: {
                input: {
                    //main: resolve('index.html'),
                    popup: resolve(commonPath.dotPlasmoDirectory, 'popup.html'), // Define popup.html as the entry point
                },
                output: {
                    entryFileNames: '[name].js', // The output name for the JavaScript files
                }
            },
        },
        plugins: [
            // Add any necessary Vite plugins here, e.g., for React, Vue, etc.
            // You can use the `@vitejs/plugin-react` plugin if you're working with React
            react(),

            {
                name: "copy-manifest",
                writeBundle() {
                    const manifestPath = commonPath.entryManifestPath;
                    console.log("manifestPath:", manifestPath)
                    const outputManifestPath = resolve(commonPath.distDirectory, "manifest.json");

                    try {
                        fs.copyFileSync(manifestPath, outputManifestPath);
                        console.log(`Copied manifest.json to ${outputManifestPath}`);
                    } catch (error) {
                        console.error("Error copying manifest.json:", error);
                    }
                },
            },

            // Plugin to copy assets to `dist/gen-assets`
            {
                name: "copy-assets",
                writeBundle() {
                    const sourceAssetsDir = resolve(commonPath.dotPlasmoDirectory, "gen-assets");
                    const targetAssetsDir = resolve(commonPath.distDirectory, "gen-assets");

                    if (!fs.existsSync(sourceAssetsDir)) {
                        console.warn(`⚠️ Source assets directory "${sourceAssetsDir}" does not exist. Skipping asset copy.`);
                        return;
                    }

                    // Ensure the target directory exists
                    fs.mkdirSync(targetAssetsDir, { recursive: true });

                    // Copy files from assets directory to `dist/gen-assets`
                    fs.readdirSync(sourceAssetsDir).forEach((file) => {
                        const sourceFile = join(sourceAssetsDir, file);
                        const targetFile = join(targetAssetsDir, file);

                        if (fs.statSync(sourceFile).isFile()) {
                            fs.copyFileSync(sourceFile, targetFile);
                            console.log(`✅ Copied asset: ${file} → ${targetFile}`);
                        }
                    });
                },
            }
        ],
        define: {
            'process.env': publicEnv.extends(bundleConfig).data,
        },
        esbuild: {
            target: process.env.__PLASMO_FRAMEWORK_INTERNAL_ES_TARGET,
        },
        resolve: {
            alias: {
                // "@plasmo-static-common/react": "/",
                "@plasmo-static-common/react": resolve(commonPath.dotPlasmoDirectory, "./static/common/react.ts")
            }
        },
        ...options
    })

    iLog(config)

    return config;
}
