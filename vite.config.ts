import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import path from 'path';
import {defineConfig} from 'vite';
import { createConfiguredGardenApi } from './server/configuredApi';

const gardenApi = () => ({
  name: 'shared-garden-api',
  configureServer(server: import('vite').ViteDevServer) {
    const api = createConfiguredGardenApi();
    server.middlewares.use((req, res, next) => { void api.handle(req, res, next); });
    server.httpServer?.once('close', api.close);
  },
  configurePreviewServer(server: import('vite').PreviewServer) {
    const api = createConfiguredGardenApi();
    server.middlewares.use((req, res, next) => { void api.handle(req, res, next); });
    server.httpServer.once('close', api.close);
  },
});

function getLastUpdateIso() {
  try {
    return process.env.VITE_LAST_UPDATE_ISO
      || execSync('git log -1 --format=%cI', { cwd: __dirname }).toString().trim();
  } catch {
    return '';
  }
}

export default defineConfig(() => {
  return {
    base: process.env.GITHUB_PAGES === 'true' ? '/ur_bro_jz/' : '/',
    define: {
      __LAST_UPDATE_ISO__: JSON.stringify(getLastUpdateIso()),
    },
    plugins: [react(), tailwindcss(), gardenApi()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5179,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: { host: '127.0.0.1', port: 4179 },
  };
});
