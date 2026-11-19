import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { searchPlaces, PlacesError } from './server/places.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function placesApi(): Plugin {
  return {
    name: 'local-places-api',
    configureServer(server) {
      server.middlewares.use('/api/places', async (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Método não permitido.' }));
          return;
        }
        try {
          let raw = '';
          for await (const chunk of req) {
            raw += chunk;
            if (raw.length > 10000) throw new PlacesError('Busca muito longa.', 413);
          }
          const result = await searchPlaces(JSON.parse(raw));
          res.end(JSON.stringify(result));
        } catch (error) {
          res.statusCode = error instanceof PlacesError ? error.status : error instanceof SyntaxError ? 400 : 500;
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro na busca.' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), placesApi()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
