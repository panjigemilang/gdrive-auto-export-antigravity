import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'download-proxy',
      configureServer(server) {
        server.middlewares.use('/api/download', async (req, res, next) => {
          try {
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const targetUrl = urlObj.searchParams.get('url');
            const filename = urlObj.searchParams.get('filename');

            if (!targetUrl || !filename) {
              res.statusCode = 400;
              res.end('Missing url or filename');
              return;
            }

            console.log(`Proxying download: ${filename} from ${targetUrl}`);

            const response = await fetch(targetUrl);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch source: ${response.statusText}`);
            }

            // Copy relevant headers, but force content-disposition
            const contentType = response.headers.get('content-type');
            if (contentType) res.setHeader('Content-Type', contentType);
            
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
            
            // Convert web stream to node stream
            const reader = response.body.getReader();
            
            // Pump the stream
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
            res.end();
            
          } catch (e) {
            console.error('Proxy error:', e);
            if (!res.headersSent) {
                res.statusCode = 500;
                res.end(`Proxy error: ${e.message}`);
            }
          }
        });
      }
    }
  ],
})
