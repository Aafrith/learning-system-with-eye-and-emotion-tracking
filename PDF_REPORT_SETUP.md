# PDF Report Feature Installation

## Install Required Package

To enable PDF report generation, you need to install the `reportlab` package.

### Installation Steps:

1. **Activate your virtual environment** (if not already activated):
   ```powershell
   # In backend directory
   .\.venv\Scripts\Activate.ps1
   ```

2. **Install reportlab**:
   ```powershell
   pip install reportlab==4.0.9
   ```

   OR install all requirements:
   ```powershell
   pip install -r requirements.txt
   ```

3. **Restart the backend server**:
   ```powershell
   python main.py
   ```

## Features Added

### PDF Reports Include:
- **Professional formatting** with headers, tables, and color coding
- **Session Information** - Code, subject, teacher, date, duration
- **Statistics Section** - Total students, average focus, engagement rates
- **Focus Distribution** - Color-coded high/medium/low categories
- **Emotion Distribution** - With emoji indicators
- **Individual Student Performance** - Detailed table with all metrics
- **Footer** - Generation timestamp and branding

### Available Formats:
1. **PDF** - Professional formatted document
2. **CSV** - Excel-compatible spreadsheet
3. **JSON** - Raw data for custom processing

### UI Updates:
- **Teacher Dashboard**: Added "PDF" and "CSV" buttons for current and past sessions
- **Reports Page**: Added "Export PDF" button for summary and session reports
- Color-coded buttons: PDF (red), CSV (green), JSON (blue)

### Endpoints Added:
- `GET /api/reports/session/{id}/export?format=pdf` - Session PDF
- `GET /api/reports/teacher/summary/export?format=pdf` - Teacher summary PDF
- `GET /api/reports/student/summary/export?format=pdf` - Student summary PDF
