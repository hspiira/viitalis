import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

export default defineConfig(({ command }) => ({
  plugins: [
    devtools(),
    // Nitro only in production: in dev it can cause only __root__/ to match, so /dashboard etc. return 404.
    command === 'build' ? nitro({ rollupConfig: { external: [/^@sentry\//] } }) : null,
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    // In dev (serve), SPA mode avoids SSR so every path serves the client app and the client router handles /dashboard (no 404 HTML).
    tanstackStart(
      command === 'serve'
        ? { spa: { enabled: true } }
        : undefined
    ),
    viteReact(),
  ].filter(Boolean),
}))
