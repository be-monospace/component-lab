import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// The Vite app IS the workbench. Library build is handled by tsup separately.
export default defineConfig({
  root: 'workbench',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@workbench': resolve(__dirname, 'workbench'),
    },
  },
  server: {
    port: 4200,
    open: true,
  },
});
