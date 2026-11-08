import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    ssr: 'server.ts',
    outDir: 'server-dist',
    emptyOutDir: true,
    copyPublicDir: false,
    rollupOptions: { output: { entryFileNames: 'server.js' } },
  },
});
