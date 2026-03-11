# Google Sheets Import Guide

## Overview
The Screens section now supports importing data directly from Google Sheets exports (CSV or TSV format).

## Column Headers Required
Your Google Sheet must have the following columns in this exact order:

| Column Name   | Description                                    | Example           |
|---------------|------------------------------------------------|-------------------|
| Screen MFR    | Manufacturer of the screen                     | Samsung           |
| Make          | Model number or make                           | QN55Q80C          |
| Screen Size   | Diagonal screen size (will auto-detect unit)   | 55 or 55"         |
| Height        | Screen height (can include unit: in, cm, mm)   | 27.2 in           |
| Width         | Screen width (can include unit: in, cm, mm)    | 48.4 in           |
| Depth         | Screen depth (can include unit: in, cm, mm)    | 1.2 in            |
| Pseudonym     | Alias/nickname for the screen (REQUIRED)       | Office Display 55"|

## How to Export from Google Sheets

1. Open your Google Sheet with screen data
2. Ensure the column headers match the required format above
3. Go to **File** → **Download** → **Tab-separated values (.tsv)** or **Comma-separated values (.csv)**
4. Save the file to your computer

## How to Import

1. Navigate to **Screens** in the database section
2. Click the **"Import from Sheets"** button in the header
3. Click **"Download Template"** if you need a sample format
4. Select your exported TSV/CSV file
5. Click **"Import"**
6. Review the import results

## Features

- **Auto-detection**: Automatically detects tab or comma delimiters
- **Unit parsing**: Supports dimensions with units (in, cm, mm) or without
- **Error reporting**: Shows detailed errors for any rows that fail to import
- **Validation**: Ensures required fields (Pseudonym) are present
- **Batch import**: Imports multiple screens at once

## Template

Download a template directly from the import dialog to see the exact format required.

## Example Data

```
Screen MFR	Make	Screen Size	Height	Width	Depth	Pseudonym
Samsung	QN55Q80C	55	27.2 in	48.4 in	1.2 in	Office Display 55"
LG	OLED65C3PUA	65	32.9 in	56.9 in	1.8 in	Conference Room OLED
Sony	XBR-85X900H	85	42.0 in	74.8 in	2.9 in	Lobby Display 85"
```

## Notes

- The **Pseudonym** field is required and will be used as the screen's alias
- Dimensions can be provided with or without units
- Screen sizes can be in inches (automatically detected)
- Empty rows are skipped
- The system will report how many rows succeeded and failed after import
