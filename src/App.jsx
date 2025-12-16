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
  const [popupBlocked, setPopupBlocked] = useState(false);

  const handleFileProcess = async (file) => {
    try {
      setProcessing(true);
      setErrorHeader(null);
      setPopupBlocked(false);
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
    setPopupBlocked(false);
    
    // Process sequentially
    for (let i = 0; i < links.length; i++) {
        const link = links[i];
      if (link.status === 'success') continue; 

      setLinks(prev => prev.map((l, idx) => idx === i ? { ...l, status: 'processing' } : l));

      try {
        const result = await downloadFile(link.downloadUrl, link.fileName);
        
        if (result.success) {
             setLinks(prev => prev.map((l, idx) => idx === i ? { 
               ...l, 
               status: 'success',
               method: result.method 
             } : l));
        } else {
             // Should not happen as downloader returns success:true even on fallback
             setLinks(prev => prev.map((l, idx) => idx === i ? { ...l, status: 'error' } : l));
        }

      } catch (e) {
        setLinks(prev => prev.map((l, idx) => idx === i ? { ...l, status: 'error' } : l));
      }

      // Check if we need to pause? 
      // Actually, standard window.open in loop works IF popups allowed.
      // We'll trust the delay.
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
        
        <div style={{ textAlign: 'center', opacity: 0.8, fontSize: '0.9rem', marginBottom: '1rem', marginTop: '1rem' }}>
             ⚠️ <strong>Important:</strong> To download multiple files, you MUST <strong>Allow Popups & Redirects</strong> for this site in your browser address bar.
        </div>

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
