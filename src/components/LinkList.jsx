import React from 'react';
import { File, CheckCircle, Clock, ExternalLink, Download } from 'lucide-react';
import './LinkList.css';

const LinkList = ({ links = [], onDownloadAll, processing }) => {
  if (!links || links.length === 0) return null;

  return (
    <div className="link-list-container glass-panel">
      <div className="link-list-header">
        <div>
          <h2>Found Files</h2>
          <p className="subtitle">{links.length} Google Drive link{links.length !== 1 ? 's' : ''} detected</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={onDownloadAll}
          disabled={processing || links.every(l => l.status === 'success')}
        >
          {processing ? 'Processing...' : 'Download All'}
        </button>
      </div>

      <div className="table-wrapper">
        <table className="links-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Row</th>
              <th>Target Name</th>
              <th>Original Link</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link, index) => (
              <tr key={`${link.id}-${index}`} className={`status-${link.status}`}>
                <td className="col-status">
                  {link.status === 'success' && <CheckCircle size={20} className="icon-success" />}
                  {link.status === 'processing' && <span className="spinner"></span>}
                  {link.status === 'idle' && <Clock size={20} className="icon-idle" />}
                  {link.status === 'error' && <span className="icon-error">!</span>}
                </td>
                <td className="col-row">#{link.row}</td>
                <td className="col-name">
                  <span className="file-name" title={link.fileName}>{link.fileName}</span>
                </td>
                <td className="col-link">
                  <div className="link-info">
                    <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" className="original-link">
                      {link.originalUrl} <ExternalLink size={12} />
                    </a>
                  </div>
                </td>
                <td className="col-action">
                  {link.status !== 'success' && (
                    <button className="btn-icon" title="Download manually" onClick={() => window.open(link.downloadUrl, '_blank')}>
                      <Download size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LinkList;
