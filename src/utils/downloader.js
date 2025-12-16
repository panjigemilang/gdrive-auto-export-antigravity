export const downloadFile = (url) => {
  // Method 1: Hidden Iframe (Cleaner, but might be blocked by X-Frame-Options)
  // Google Drive usually allows this for simple file downloads.
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 60000); // 1 minute timeout
};

export const openInNewTab = (url) => {
  window.open(url, '_blank');
};
