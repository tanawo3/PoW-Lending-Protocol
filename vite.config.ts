import { nodePolyfills } from 'vite-plugin-node-polyfills';
import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss(), nodePolyfills({ globals: { Buffer: true, global: true, process: true } }), {
    name: 'save-contract-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/save-contract' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const { address } = JSON.parse(body);
              if (address) {
                fs.writeFileSync('.env', `VITE_CONTRACT_ADDRESS=${address}\n`);
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true }));
                return;
              }
            } catch(e) {}
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid payload' }));
          });
        } else if (req.url === '/api/clear-contract' && req.method === 'POST') {
          fs.writeFileSync('.env', `VITE_CONTRACT_ADDRESS=\n`);
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true }));
        } else {
          next();
        }
      });
    }
  }],
  
  define: {
    global: "globalThis",
  },
  build: {
    target: "es2020",
    outDir: "dist",
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
