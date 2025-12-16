export default async function handler(req, res) {
  const { url, filename } = req.query;

  if (!url || !filename) {
    return res.status(400).send('Missing url or filename');
  }

  try {
    console.log(`[Vercel Proxy] Proxying: ${filename} from ${url}`);

    // Fetch from upstream Google Drive
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');

    // Check for failure or Login Page (Private File)
    if (!response.ok || (contentType && contentType.includes('text/html'))) {
        console.warn('Proxy failed (Private file or Error). Status:', response.status);
        return res.status(403).send('Proxy cannot access private file');
    }

    // --- Extension Logic (Same as Vite config) ---
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

    let finalFilename = filename;
    if (extension && !finalFilename.toLowerCase().endsWith(extension)) {
        finalFilename += extension;
    }

    // Strict Filename Encoding
    finalFilename = finalFilename.replace(/[\r\n\t]/g, '');
    const encodedFilename = encodeURIComponent(finalFilename);

    // Set Headers
    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);

    // Stream response
    // Node.js fetch (Vercel) returns a body that can be piped
    // We need to handle the stream conversion depending on Vercel's Node environment
    
    // Convert Web Stream to Node Stream if necessary, or just arrayBuffer
    // Simple way for Vercel/Node:
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);

  } catch (e) {
    console.error('Proxy error:', e);
    res.status(500).send(e.message);
  }
}
