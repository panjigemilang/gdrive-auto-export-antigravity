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
        // Attempt to downlod using blob to rename the file.
        // If it fails (due to CORS/private file), fallback to opening in new tab.
        const success = await downloadFile(link.downloadUrl, link.fileName);
        
        if (!success) {
          // Fallback
          window.open(link.downloadUrl, '_blank');
        }
        
        // We assume success if no error thrown by window.open or if downloadFile returned true
        setLinks(prev => prev.map((l, idx) => idx === i ? { ...l, status: 'success' } : l));
        
      } catch (e) {
        setLinks(prev => prev.map((l, idx) => idx === i ? { ...l, status: 'error' } : l));
      }

      // Wait 1.5s before next one to manage browser load/rate limits
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
