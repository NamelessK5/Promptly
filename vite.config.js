import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json' assert { type: 'json' };

export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: false
    },
    plugins: [
        crx({
            manifest,
            browser: 'chrome'
        })
    ],
    server: {
        port: 5173,
        strictPort: true,
        hmr: {
            port: 5173
        }
    }
});