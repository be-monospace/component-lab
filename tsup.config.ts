import { defineConfig } from 'tsup';
import { cp } from 'node:fs/promises';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  external: ['react', 'react-dom'],
  loader: {
    '.css': 'copy',
  },
  async onSuccess() {
    await cp('src/tokens', 'dist/tokens', { recursive: true });
  },
});
