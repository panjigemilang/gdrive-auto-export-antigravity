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
            let filename = urlObj.searchParams.get('filename');

            if (!targetUrl || !filename) {
              res.statusCode = 400;
              res.end('Missing url or filename');
              return;
            }

            console.log(`Proxying: ${filename} from ${targetUrl}`);

            // Fetch from upstream (no credentials, so works for Public files only)
            const response = await fetch(targetUrl);
            
            const contentType = response.headers.get('content-type');
            
            // Check for failure or Login Page (HTML)
            // If it's a private file, GDrive might return 200 OK with a Login Page HTML.
            // We treat that as failure so frontend can fallback to direct window.open
            if (!response.ok || (contentType && contentType.includes('text/html'))) {
               console.warn('Proxy failed (Private file or Error). Status:', response.status, 'Type:', contentType);
               res.statusCode = 403; // Forbidden/Fail
               res.end('Proxy cannot access private file');
               return;
            }

            // --- Extension Logic ---
            // User complained extension was missing. We fix it here server-side.
            const mimeToExt = {
              'image/jpeg': '.jpg',
              'image/jpg': '.jpg',
              'image/png': '.png',
              'application/pdf': '.pdf',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
              'text/csv': '.csv',
              'text/plain': '.txt',
              'application/msword': '.doc',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
            };

            let extension = '';
            if (contentType) {
               const type = contentType.split(';')[0].trim().toLowerCase();
               if (mimeToExt[type]) extension = mimeToExt[type];
               else if (type.includes('/')) {
                   const subtype = type.split('/')[1];
                   if (subtype && subtype.length <= 4 && /^[a-z0-9]+$/i.test(subtype)) extension = '.' + subtype;
               }
            }

            // Append extension if filename doesn't have it
            if (extension && !filename.toLowerCase().endsWith(extension)) {
                filename += extension;
            }
            // -----------------------

            // Strict Filename Encoding for Browser
            // Remove control chars
            filename = filename.replace(/[\r\n\t]/g, '');
            const encodedFilename = encodeURIComponent(filename);
            
            // Set Headers
            if (contentType) res.setHeader('Content-Type', contentType);
            // This forces the "Rename"
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);

            // Stream it
            const reader = response.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
            res.end();
            return;

          } catch (e) {
            console.error('Proxy error:', e);
            if (!res.headersSent) {
                res.statusCode = 500;
                res.end(e.message);
            }
          }
          next();
        });
      }
    }
  ],
})
