# GDrive Auto Export Antigravity

A modern web application to batch download files from Google Drive links extracted from CSV or XLSX files.

## Features
- **File Parsing**: Drag and drop `.csv` or `.xlsx` files.
- **Link Extraction**: Automatically detects multiple formats of Google Drive links.
- **Batch Download**: Downloads files sequentially to manage browser resources.
- **Visual Feedback**: Real-time status updates for each file (Success, Processing, Error).

## Usage
1.  Ensure the development server is running:
    ```bash
    npm run dev
    ```
2.  Open [http://localhost:5173](http://localhost:5173) in your browser.
3.  Upload your spreadsheet containing Google Drive links.
4.  Click "Download All" to start the batch download process.
    - **Note**: You may need to allow popups for `localhost:5173` in your browser settings for the batch download to work correctly.

## Tech Stack
-   React + Vite
-   PapaParse (CSV)
-   SheetJS / xlsx (Excel)
-   Lucide React (Icons)
-   Vanilla CSS (Styling)
