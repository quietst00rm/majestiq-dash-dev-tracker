export enum ApplicantStatus {
  NEW = 'New',
  REVIEWING = 'Reviewing',
  INTERVIEW = 'Interview',
  OFFER = 'Offer',
  HIRED = 'Hired',
  REJECTED = 'Rejected',
}

export interface Note {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

export interface AIAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  rating: number; // 1-10
  suggestedQuestions: string[];
  resumeSummary?: string; // Markdown formatted summary of the resume/profile
}

export interface Applicant {
  id: string; // generated or row index
  timestamp: string;
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;
  
  // Tech Ratings
  ratingTS: string;
  ratingNode: string;
  ratingReact: string;
  ratingSQL: string;
  ratingETL: string;

  // Scenarios
  scenarioIngestion: string;
  cloudProviders: string;
  scenarioIsolation: string;
  scenarioState: string;

  compensation: string;
  availability: string;
  resumeUrl: string;

  // Sheet specific / Editable Recruiter Data
  sheetAiRating: string;
  sheetComments: string; // "Sandeep Comments"
  callDetails: string;   // "Call Details"
  currentCtc: string;    // "Current CTC/Month"

  // Augmented fields (local state or synced back to sheet columns)
  status: ApplicantStatus;
  notes: Note[];
  aiAnalysis?: AIAnalysis;
  isFavorite: boolean;
}

// Map CSV headers to Applicant properties
// Using exact strings from the provided CSV for robust mapping
export const CSV_MAPPING: Record<string, keyof Applicant> = {
  'Timestamp': 'timestamp',
  'Email Address': 'email',
  'Full Name': 'fullName',
  'WhatsApp Number': 'phone',
  'LinkedIn Profile URL': 'linkedin',
  'GitHub / Portfolio URL': 'github',
  'Please provide links to 2-3 of your most complex full-stack projects or relevant portfolio items': 'portfolio',
  'How would you rate your expertise level with the core technologies required for this role? [TypeScript]': 'ratingTS',
  'How would you rate your expertise level with the core technologies required for this role? [Node.js]': 'ratingNode',
  'How would you rate your expertise level with the core technologies required for this role? [React (Frontend)]': 'ratingReact',
  'How would you rate your expertise level with the core technologies required for this role? [PostgreSQL (Database Design/Queries)]': 'ratingSQL',
  'How would you rate your expertise level with the core technologies required for this role? [ETL/Data Pipelines]': 'ratingETL',
  'How would you rate your expertise level with the core technologies required for this role? [PostgresSQL]': 'ratingSQL', // Handling duplicate/typo in CSV header if present
  'Data Ingestion Scenario: This dashboard relies on the Cajari API, which runs daily reports (snapshots) rather than real-time streams. We need to ingest 17 different report types (JSON & CSV) every morning. Briefly describe how you would design a robust Cron/Scheduler system to handle this ingestion, ensuring we track history when data changes between days.': 'scenarioIngestion',
  'Which cloud provider(s) (e.g., AWS, GCP, Azure, DigitalOcean) have you used for deploying and managing complex applications?': 'cloudProviders',
  'We require strict data isolation for multiple clients (Agencies & Sellers) within the same database. Would you implement Row Level Security (RLS) or logical isolation in the query layer? Why?': 'scenarioIsolation',
  'We have complex tables that require sorting, filtering, and nested row expansion (e.g., viewing appeal history inside a violation row). Which React library or approach would you use to handle this state management efficiently?': 'scenarioState',
  'What is your desired monthly compensation (USD, independent contractor rate)?': 'compensation',
  'Availability': 'availability',
  'Upload Resume/CV': 'resumeUrl',
  'AI Rating ': 'sheetAiRating',
  'Sandeep Comments': 'sheetComments',
  'Call Details': 'callDetails',
  'Current CTC/Month': 'currentCtc'
};