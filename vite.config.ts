import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables for the current mode
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react()],
    server: {
      port: Number(env.VITE_PORT) || 3000,
      host: '127.0.0.1',
    },
  };
});
