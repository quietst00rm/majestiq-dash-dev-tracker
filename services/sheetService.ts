import { Applicant, ApplicantStatus, CSV_MAPPING, AIAnalysis } from "../types";

// The provided public Google Sheet URL
const SHEET_ID = '1KLNx6IsNcDF9ven4DYL5oOzsnuT3-p3fXWEKGGv0bJc';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// Google Apps Script endpoint for writing to Sheet
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyQwIfa-QUGQZkVmAJOYUcukwTmfZILVDkfe5Wnyixq55abZaslRpby6FBREh7YKbwa/exec';

// Robust CSV Parser that handles multiline values and quotes
const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  
  // Normalize line endings
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote: "" -> "
        currentCell += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if (char === '\n' && !inQuotes) {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  
  // Push last cell/row if exists
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
};

export const fetchApplicants = async (): Promise<Applicant[]> => {
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error("Failed to fetch CSV");
    
    const text = await response.text();
    const rows = parseCSV(text);
    
    if (rows.length < 2) return [];

    // Parse headers - trim whitespace and remove quotes if any remain (parser usually handles quotes but safety first)
    const headers = rows[0].map(h => h.trim());
    
    // Create a mapping index to avoid O(n^2) lookups
    const headerIndexMap: Record<string, number> = {};
    headers.forEach((h, i) => {
        headerIndexMap[h] = i;
    });

    const applicants: Applicant[] = rows.slice(1).map((row, index) => {
      const app: any = {
        id: `app_${index}`,
        status: ApplicantStatus.NEW,
        notes: [],
        isFavorite: false,
        aiAnalysis: undefined
      };

      // Automapping
      Object.keys(CSV_MAPPING).forEach(csvHeader => {
         const targetProp = CSV_MAPPING[csvHeader];
         // Try exact match first
         let colIndex = headerIndexMap[csvHeader];
         
         // If exact match fails, try case-insensitive or partial (for robustness)
         if (colIndex === undefined) {
             const key = Object.keys(headerIndexMap).find(h => h.toLowerCase().trim() === csvHeader.toLowerCase().trim());
             if (key) colIndex = headerIndexMap[key];
         }

         if (colIndex !== undefined && row[colIndex] !== undefined) {
             app[targetProp] = row[colIndex].trim();
         } else {
             // Default empty string for missing fields
             app[targetProp] = '';
         }
      });
      
      // Fallback/Safety
      if (!app.fullName) app.fullName = "Unknown Candidate";
      if (!app.email) app.email = "no-email@provided.com";

      // Reconstruct aiAnalysis from sheet columns if they exist
      if (app.sheetAiRating && app.sheetAiSummary) {
        app.aiAnalysis = {
          rating: parseFloat(app.sheetAiRating) || 0,
          summary: app.sheetAiSummary || '',
          strengths: app.sheetAiStrengths ? app.sheetAiStrengths.split(';').map((s: string) => s.trim()).filter(Boolean) : [],
          weaknesses: app.sheetAiWeaknesses ? app.sheetAiWeaknesses.split(';').map((s: string) => s.trim()).filter(Boolean) : [],
          suggestedQuestions: app.sheetAiQuestions ? app.sheetAiQuestions.split(';').map((s: string) => s.trim()).filter(Boolean) : []
        };
      }

      return app as Applicant;
    });

    // Merge with local storage state to persist changes made in the app
    // We treat the Sheet as the Source of Truth for raw data, and LocalStorage as the SOT for App Status/Notes/Edits
    const storedData = localStorage.getItem('gemini_recruit_data_v2');
    if (storedData) {
      const parsedStore = JSON.parse(storedData);
      return applicants.map(app => {
        const storedApp = parsedStore[app.email];
        if (storedApp) {
          return { 
             ...app, 
             // Merge local overrides for editable fields
             status: storedApp.status || app.status,
             isFavorite: storedApp.isFavorite,
             aiAnalysis: storedApp.aiAnalysis,
             // Merge notes (avoid duplicating if we were parsing sheet comments to notes previously)
             notes: storedApp.notes || app.notes,
             // Explicitly use stored values for editable fields if they exist, simulating a write-back
             sheetComments: storedApp.sheetComments !== undefined ? storedApp.sheetComments : app.sheetComments,
             callDetails: storedApp.callDetails !== undefined ? storedApp.callDetails : app.callDetails,
             currentCtc: storedApp.currentCtc !== undefined ? storedApp.currentCtc : app.currentCtc,
          };
        }
        return app;
      });
    }

    return applicants;
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    return [];
  }
};

export const updateApplicantData = async (applicant: Applicant): Promise<boolean> => {
  try {
    // In a real production app with OAuth, we would push updates to the Sheet here.
    // e.g., await google.sheets.spreadsheets.values.update(...)
    
    // For this implementation, we persist state locally to simulate the "Write"
    
    const storedData = localStorage.getItem('gemini_recruit_data_v2');
    const parsedStore = storedData ? JSON.parse(storedData) : {};
    
    parsedStore[applicant.email] = {
      status: applicant.status,
      notes: applicant.notes,
      isFavorite: applicant.isFavorite,
      aiAnalysis: applicant.aiAnalysis,
      // Persist editable fields
      sheetComments: applicant.sheetComments,
      callDetails: applicant.callDetails,
      currentCtc: applicant.currentCtc
    };

    localStorage.setItem('gemini_recruit_data_v2', JSON.stringify(parsedStore));

    // If there's AI analysis, also write to Google Sheet
    if (applicant.aiAnalysis) {
      await writeAIAnalysisToSheet(applicant.email, applicant.aiAnalysis);
    }

    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// Write AI analysis to Google Sheet via Apps Script
export const writeAIAnalysisToSheet = async (email: string, analysis: AIAnalysis): Promise<boolean> => {
  try {
    const payload = {
      email,
      rating: analysis.rating,
      summary: analysis.summary,
      strengths: analysis.strengths.join('; '),
      weaknesses: analysis.weaknesses.join('; '),
      questions: analysis.suggestedQuestions.join('; ')
    };

    // Use URL parameters for Apps Script (more reliable than POST body with CORS)
    const params = new URLSearchParams();
    params.append('data', JSON.stringify(payload));

    const response = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`, {
      method: 'GET',
      mode: 'no-cors'
    });

    console.log(`AI analysis for ${email} sent to Google Sheet`);
    return true;
  } catch (error) {
    console.error('Error writing to Google Sheet:', error);
    return false;
  }
};