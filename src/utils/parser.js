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

const cleanDateForFilename = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    // User requested format: DDMMYYYY (e.g. 16072025)
    return `${dd}${mm}${yyyy}`;
  }
  // Fallback
  return String(dateStr).replace(/[\/\-]/g, '');
};

const parseDateForSort = (dateStr) => {
  if (!dateStr) return new Date(0);
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date(0) : d;
  } catch {
    return new Date(0);
  }
};

const constructFileName = (row) => {
  // Try to map columns flexibly (case-insensitive keys would be better but simple first)
  // Keys from CSV/Excel might differ slightly, checking common variations
  const keys = Object.keys(row);
  
  const findKey = (search) => keys.find(k => k.toLowerCase().includes(search.toLowerCase()));
  
  const nameKey = findKey('Nama') || findKey('Name');
  const placeKey = findKey('Tempat') || findKey('Place') || findKey('Location') || findKey('WFC');
  const dateKey = findKey('Tanggal') || findKey('Date');

  const name = nameKey ? String(row[nameKey]).trim() : 'Unknown';
  const place = placeKey ? String(row[placeKey]).trim() : 'Unknown';
  const dateVal = dateKey ? String(row[dateKey]).trim() : '';
  
  const dateStr = cleanDateForFilename(dateVal);
  
  if (name === 'Unknown' && place === 'Unknown') return null; // Fallback for standard naming if metadata missing

  return `${name} - ${place} - ${dateStr}`;
};

const processData = (data) => {
  const links = [];
  const uniqueIds = new Set();
  
  // Data is array of objects
  data.forEach((row, rowIndex) => {
    // Find link in values
    const values = Object.values(row);
    let linkFound = null;
    let fileId = null;

    for (const val of values) {
      if (typeof val === 'string' && val.includes('drive.google.com')) {
        fileId = extractDriveId(val);
        if (fileId) {
          linkFound = val;
          break;
        }
      }
    }

    if (fileId && !uniqueIds.has(fileId)) {
      uniqueIds.add(fileId);
      
      const customName = constructFileName(row);
      const fileName = customName || `File_${fileId}`;
      
      // Get date for sorting
      // Assuming 'Tanggal WFC' or similar exists
      const keys = Object.keys(row);
      const dateKey = keys.find(k => k.toLowerCase().includes('tanggal') || k.toLowerCase().includes('date'));
      const dateSort = dateKey ? parseDateForSort(row[dateKey]) : new Date(0);
      const nameKey = keys.find(k => k.toLowerCase().includes('nama') || k.toLowerCase().includes('name'));
      const nameSort = nameKey ? row[nameKey] : '';

      links.push({
        id: fileId,
        originalUrl: linkFound,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
        status: 'idle',
        fileName: fileName,
        row: rowIndex + 2, // +2 because header is row 1
        sortObj: { date: dateSort, name: nameSort }
      });
    }
  });
  
  // Sort by Name then Date
  links.sort((a, b) => {
    const nameCompare = String(a.sortObj.name).localeCompare(String(b.sortObj.name));
    if (nameCompare !== 0) return nameCompare;
    return a.sortObj.date - b.sortObj.date;
  });

  return links;
};

const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true, // Key change: Parse with headers
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const links = processData(results.data);
          resolve(links);
        } catch (e) {
          reject(e);
        }
      },
      error: (error) => reject(error)
    });
  });
};

const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false }); // raw strings preferred
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        // header: 0 allows sheet_to_json to use first row as keys
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false }); 
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
