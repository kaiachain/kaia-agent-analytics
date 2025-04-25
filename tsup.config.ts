import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"], // Add ["cjs"] if you want to support CommonJS
    dts: false, // Set to true if you want to create this as a library
    splitting: true,
    sourcemap: true,
    clean: true,
    target: "ES2020",
});