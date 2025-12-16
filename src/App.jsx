import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import LinkList from './components/LinkList';
import { parseFile } from './utils/parser';
import { downloadFile, openInNewTab } from './utils/downloader';
import './App.css';

function App() {
  const [links, setLinks] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [errorHeader, setErrorHeader] = useState(null);

  const handleFileProcess = async (file) => {
    try {
      setProcessing(true);
      setErrorHeader(null);
      const parsedLinks = await parseFile(file);
      setLinks(parsedLinks);
      if (parsedLinks.length === 0) {
        setErrorHeader('No Google Drive links found in the uploaded file.');
      }
    } catch (error) {
      console.error(error);
      setErrorHeader(`Error parsing file: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    setProcessing(true);
    
    // Process sequentially with delay to avoid browser blocking
    for (let i = 0; i < links.length; i++) {
        const link = links[i];
      if (link.status === 'success') continue; // Skip already downloaded

      // Update status to processing
      setLinks(prev => prev.map((l, idx) => idx === i ? { ...l, status: 'processing' } : l));

      // Attempt download
      try {
        // Use window.open for Google Drive links as they are often cross-origin redirects
        // which iframe download approach struggles with (X-Frame-Options)
        // However, popups need to be allowed.
        // Let's try the iframe approach first (defined in downloader), fallback to new tab if needed?
        // Actually for this v1, simple window.open is more reliable for Drive.
        // We will use the custom downloader function which we can tune.
        
        // Check if we want to use the iframe trick? 
        // Google Drive export links usually enforce X-Frame-Options: SAMEORIGIN
        // So iframe usually fails silently.
        // Better to just open in new tab.
        // But doing this in a loop triggers popup blocker.
        // We can warn the user.
        
        // Let's try a hybrid:
        // Use the 'downloadFile' function we made.
        // If it's the iframe one, it returns undefined.
        
        // For safety/compatibility with the "Auto" request, I will use window.open in the loop
        // and hope the user allows popups.
        window.open(link.downloadUrl, '_blank');
        
        // We can't easily know if it succeeded cross-origin, so we assume success if no crash.
        // Update status to success
        setLinks(prev => prev.map((l, idx) => idx === i ? { ...l, status: 'success' } : l));
        
      } catch (e) {
        setLinks(prev => prev.map((l, idx) => idx === i ? { ...l, status: 'error' } : l));
      }

      // Wait 1.5s before next one
      if (i < links.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    setProcessing(false);
  };

  return (
    <div className="container">
      <header className="app-header">
        <h1 className="app-title">GDrive Auto Export</h1>
        <p className="app-desc">Batch download Google Drive files from CSV or XLSX.</p>
      </header>

      <main className="main-content">
        <FileUpload onFileProcess={handleFileProcess} />
        
        {errorHeader && (
          <div className="glass-panel" style={{ padding: '1rem', color: 'var(--error)', textAlign: 'center' }}>
            {errorHeader}
          </div>
        )}

        {links.length > 0 && (
          <LinkList 
            links={links} 
            onDownloadAll={handleDownloadAll} 
            processing={processing} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
