import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/grocery-buddy/',
  build: {
    outDir: 'dist'
  },
  define: {
    'process.env.VITE_GA_TRACKING_ID': JSON.stringify(process.env.VITE_GA_TRACKING_ID),
    'process.env.VITE_ENV': JSON.stringify(process.env.VITE_ENV)
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  }
}); 