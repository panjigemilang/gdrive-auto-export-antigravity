import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const parseFile = async (file) => {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  if (fileExtension === 'csv') {
    return parseCSV(file);
  } else if (['xls', 'xlsx'].includes(fileExtension)) {
    return parseExcel(file);
  } else {
    throw new Error('Unsupported file type. Please upload .csv or .xlsx');
  }
};

const extractDriveId = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // Patterns:
  // 1. https://drive.google.com/file/d/VIDEO_ID/view...
  // 2. https://drive.google.com/uc?id=FILE_ID...
  // 3. https://drive.google.com/open?id=FILE_ID...
  
  const patterns = [
    /\/file\/d\/([-a-zA-Z0-9_]+)/,
    /uc\?.*id=([-a-zA-Z0-9_]+)/,
    /open\?.*id=([-a-zA-Z0-9_]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

const processData = (rows) => {
  const links = [];
  const uniqueIds = new Set();

  rows.forEach((row, rowIndex) => {
    // Row can be object (if header matched) or array
    const values = Array.isArray(row) ? row : Object.values(row);
    
    values.forEach((cell) => {
      const cellStr = String(cell);
      if (cellStr.includes('drive.google.com')) {
        const fileId = extractDriveId(cellStr);
        if (fileId && !uniqueIds.has(fileId)) {
          uniqueIds.add(fileId);
          links.push({
            id: fileId,
            originalUrl: cellStr,
            downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
            status: 'idle', // idle, pending, success, error
            fileName: `File_${fileId}`, // Placeholder until downloaded or if extracted from other column
            row: rowIndex + 1
          });
        }
      }
    });
  });
  
  return links;
};

const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const links = processData(results.data);
          resolve(links);
        } catch (e) {
          reject(e);
        }
      },
      error: (error) => reject(error),
      header: false, // Parse as arrays to be safer/broader
      skipEmptyLines: true
    });
  });
};

const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Header: 1 returns arrays
        const links = processData(jsonData);
        resolve(links);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
