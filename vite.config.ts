import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * supabase-js is its own chunk so the Door never waits for it (see
 * `src/lib/supabase.ts`). Every other entry URL — /home, /auth/…, an NFC
 * /t/… link — needs the session before it can draw, so for those the page
 * starts fetching that chunk alongside the entry instead of after it; an NFC
 * link also fetches the Touch screen's chunk. The Door's `/` is left alone so
 * nothing competes with its first paint.
 */
function preloadAuthOffDoor(): Plugin {
  return {
    name: 'linka:preload-auth-off-door',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const chunks = Object.values(ctx.bundle ?? {}).filter((out) => out.type === 'chunk')
        const entry = chunks.find((chunk) => chunk.isEntry)
        // A chunk and the chunks it statically imports, minus the entry itself.
        const withImports = (module: string) => {
          const chunk = chunks.find((out) => out.facadeModuleId?.includes(module))
          return chunk ? [chunk.fileName, ...chunk.imports].filter((file) => file !== entry?.fileName) : []
        }
        const auth = withImports('/@supabase/supabase-js/')
        const touch = withImports('/src/features/touch/TouchScreen')
        if (auth.length === 0 || touch.length === 0) return html

        const list = (files: string[]) => JSON.stringify(files.map((file) => `/${file}`))
        const script =
          `(function(p){function f(a){a.forEach(function(h){var l=document.createElement('link');l.rel='modulepreload';l.href=h;document.head.appendChild(l)})}` +
          `if(p!=='/')f(${list(auth)});if(p.indexOf('/t/')===0)f(${list(touch)})})(location.pathname)`
        return { html, tags: [{ tag: 'script', children: script, injectTo: 'head-prepend' }] }
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), preloadAuthOffDoor()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
