import React, { useRef, useState } from 'react';
import { Upload, FileUp, FileSpreadsheet } from 'lucide-react';
import './FileUpload.css';

const FileUpload = ({ onFileProcess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files[0]);
    }
  };

  const handleFiles = (file) => {
    onFileProcess(file);
  };

  return (
    <div 
      className={`upload-area glass-panel ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={(e) => e.target.files.length > 0 && handleFiles(e.target.files[0])}
        accept=".csv,.xlsx,.xls"
        hidden 
      />
      
      <div className="upload-content">
        <div className="icon-wrapper">
          {isDragging ? <FileUp size={48} /> : <Upload size={48} />}
        </div>
        <h3>Upload or Drag & Drop</h3>
        <p className="upload-hint">Supported formats: .CSV, .XLSX</p>
        <p className="sub-hint">We'll automatically extract Google Drive links</p>
      </div>
    </div>
  );
};

export default FileUpload;
