import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';
import nitro from 'nitropack';

export default defineConfig({
  plugins: [tanstackStart(), nitro(), viteReact()],
});
