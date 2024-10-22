import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import { DiscordProxy } from '@robojs/patch';

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '../',
  plugins: [react(), DiscordProxy.Vite()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    },
    cors: true
  },
});
