export const downloadFile = async (url, filename) => {
  try {
    // Determine target URL: use local proxy to handle headers and CORS
    // This allows us to enforce the filename
    const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    
    // Create a temporary anchor to trigger download
    const a = document.createElement('a');
    a.href = proxyUrl;
    // The server will set Content-Disposition, but setting download here helps too
    a.download = filename; 
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    
    // We assume success if the request was initiated.
    // Since it's a navigation/download, we can't easily wait for "completion" in JS without using Streams,
    // but the 'a.click()' is generic enough.
    // To better track success, we could fetch() it as a blob again, but the Proxy streams it.
    // For large files, fetch blob might be better IF we trust the proxy.
    // Let's rely on the proxy stream. 
    return true; 
  } catch (error) {
    console.error('Download failed', error);
    return false;
  }
};

export const openInNewTab = (url) => {
  window.open(url, '_blank');
};
