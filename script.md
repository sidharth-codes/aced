# Google Apps Script — Spreadsheet Backend

This file documents the full Google Apps Script (GAS) Web App code that powers the ACED site's dynamic data.  
Deploy this script as a **Web App** (Execute as: Me, Access: Anyone) and paste the resulting URL into `script.js` as `GOOGLE_APPS_SCRIPT_WEBAPP_URL`.

---

## Spreadsheet Sheet Layout

| Sheet Name    | Columns (row 1 = headers)                                                |
|---------------|--------------------------------------------------------------------------|
| `Recognition` | `Title`, `Description`, `Date`, `Tag`, `ImageURL`                        |
| `Gallery`     | `ImageURL`, `AltText`                                                     |
| `Members`     | `Name`, `Designation`, `ImageURL`, `AltText`                             |
| `News`        | `Title`, `Excerpt`, `Date`, `Tag`, `ImageURL`, `Link`, `Featured`        |

> **News columns:**
> - `Title` — headline of the news item
> - `Excerpt` — short description / teaser
> - `Date` — publication date string (e.g. `"July 2026"`)
> - `Tag` — category label (e.g. `"Announcements"`, `"Events"`, `"Achievements"`, `"Workshops"`)
> - `ImageURL` — Google Drive share URL for the image
> - `Link` — URL to full article or announcement (can be empty)
> - `Featured` — `"TRUE"` / `"FALSE"` — first `TRUE` row becomes the feature card

---

## Google Apps Script Code

Paste the code below into the Apps Script editor (`Extensions → Apps Script`).

```javascript
const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet();

function doGet(e) {
  const action = e.parameter.action;
  let result;

  try {
    if (action === "getRecognition") {
      result = getSheetData("Recognition");
    } else if (action === "getGallery") {
      result = getSheetData("Gallery");
    } else if (action === "getMembers") {
      result = getSheetData("Members");
    } else if (action === "getNews") {
      result = getSheetData("News");
    } else {
      result = { status: "error", message: "Unknown action: " + action };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Generic helper — reads a named sheet and returns all rows as
 * an array of objects keyed by the first-row headers.
 * Empty rows are skipped.
 */
function getSheetData(sheetName) {
  const sheet = SHEET_ID.getSheetByName(sheetName);
  if (!sheet) {
    return { status: "error", message: "Sheet not found: " + sheetName };
  }

  const [headers, ...rows] = sheet.getDataRange().getValues();
  const data = rows
    .filter(row => row.some(cell => cell !== ""))   // skip blank rows
    .map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] !== undefined ? String(row[i]) : "";
      });
      return obj;
    });

  return { status: "success", data };
}
```

---

## Deployment Steps

1. Open your Google Spreadsheet → **Extensions → Apps Script**
2. Paste the code above, replacing any default content
3. Click **Deploy → New deployment**
4. Set:
   - **Type**: Web app
   - **Execute as**: Me
   - **Who has access**: Anyone
5. Click **Deploy** and copy the **Web app URL**
6. In `script.js`, replace the value of `GOOGLE_APPS_SCRIPT_WEBAPP_URL` with the copied URL

---

## How the News Sheet is Used

The `getNews` action returns all rows from the `News` sheet as JSON.  
`script.js` calls `renderNews(data)`, which:

- Finds the **first row with `Featured === "TRUE"`** → renders it as the **feature card** (`.feat`)
- Splits remaining rows: first 3 fill the **Recent grid** (`.grid3`), the rest fill the **Earlier this year list** (`.nlist`)
- Filter buttons (`.fp`) filter all rendered cards by their `Tag` value
- If `Link` is present the Read button becomes a real anchor; otherwise it shows a disabled state

