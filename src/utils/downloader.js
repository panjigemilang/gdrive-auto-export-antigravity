export const downloadFile = async (url, filename) => {
  try {
    // Strategy: Try via Proxy first to enforce renaming.
    // The Proxy works for Public files (no auth needed).
    // If Proxy fails (e.g. Private file requires Auth), it returns 403.
    // Then we fallback to window.open (Original Name, but valid file).

    const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    
    const response = await fetch(proxyUrl);
    
    if (response.ok) {
        // Success! Proxy fetched the file. 
        // We act like it's a direct download, but now we have the blob.
        // The Proxy has already handled the Extension logic internally.
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // We rely on the Proxy's Content-Disposition, but we also set the download attribute
        // The browser will use the name we give here mostly.
        // But since the Proxy appends extension, we might want to capture it?
        // Actually, for blob, the 'download' attribute is king.
        // We should try to see if header gives us the final name?
        // Header: content-disposition: attachment; filename*=UTF-8''...
        // It's hard to parse header in JS from fetch.
        // But we passed 'filename' to proxy. Proxy APPENDED extension if missing.
        // So the 'filename' variable here lacks extension!
        // We should detect extension here too to match?
        // OR trust the proxy header if we were doing window.location = proxyUrl?
        // If we do window.location = proxyUrl, we can't catch 403 easily (it shows error page).
        // So fetch is better.
        
        // Let's re-detect extension here just to be safe for the <a> tag
        const contentType = response.headers.get('content-type');
        let finalName = filename;
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
        if (contentType) {
             const type = contentType.split(';')[0].trim().toLowerCase();
             let ext = mimeToExt[type];
             if (!ext && type.includes('/')) {
                  const subtype = type.split('/')[1];
                  if (subtype && subtype.length <= 4) ext = '.' + subtype;
             }
             if (ext && !finalName.toLowerCase().endsWith(ext)) {
                 finalName += ext;
             }
        }

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = finalName; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
        return { success: true, method: 'rename' };
    } else {
        // Proxy Refused (likely Private file)
        throw new Error('Proxy declined (Private File)');
    }

  } catch (error) {
    console.warn('Proxy download failed, using fallback:', error);
    openInNewTab(url);
    // Return success to UI because the user GETS the file, just not renamed.
    return { success: true, method: 'fallback' };
  }
};

export const openInNewTab = (url) => {
  window.open(url, '_blank');
};
