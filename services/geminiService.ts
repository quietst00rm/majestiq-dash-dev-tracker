import { GoogleGenAI, Type } from "@google/genai";
import { Applicant, AIAnalysis } from "../types";

// Initialize the Gemini API client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeCandidate = async (applicant: Applicant): Promise<AIAnalysis | null> => {
  const ai = getClient();
  if (!ai) return null;

  try {
    const prompt = `
      You are an expert Technical Recruiter and Senior Full Stack Engineer. 
      Analyze the following job applicant for a Senior Full Stack Developer position.
      
      Candidate Profile:
      Name: ${applicant.fullName}
      LinkedIn: ${applicant.linkedin}
      GitHub: ${applicant.github}
      Portfolio: ${applicant.portfolio}
      Resume: ${applicant.resumeUrl}
      Compensation Ask: ${applicant.compensation}

      Self-Reported Technical Ratings:
      - TypeScript: ${applicant.ratingTS}
      - Node.js: ${applicant.ratingNode}
      - React: ${applicant.ratingReact}
      - PostgreSQL: ${applicant.ratingSQL}
      - ETL/Pipelines: ${applicant.ratingETL}
      - Cloud: ${applicant.cloudProviders}

      Technical Scenario Responses:
      1. Data Ingestion (Cron/ETL) Strategy:
      "${applicant.scenarioIngestion}"

      2. Database Isolation Strategy (Multi-tenancy):
      "${applicant.scenarioIsolation}"

      3. Complex Frontend State Management:
      "${applicant.scenarioState}"

      Task:
      Analyze their technical depth based on the discrepancy between their self-ratings and their actual answers to the scenario questions. 
      Look for depth of understanding, architectural patterns (e.g., RLS vs logical isolation, idempotency in ETL), and specific tool choices.

      Provide a structured JSON response with:
      - A professional summary (max 30 words)
      - Key strengths (max 3, technical or soft skills)
      - Red flags or weaknesses (max 3, e.g., shallow answers, mismatch in salary expectations vs skill, availability)
      - A suitability rating from 1-10 (be strict, 7+ should be interview ready)
      - 3 deep-dive interview questions tailored to challenge their specific answers provided above.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            rating: { type: Type.NUMBER },
            suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["summary", "strengths", "weaknesses", "rating", "suggestedQuestions"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as AIAnalysis;
  } catch (error) {
    console.error("Error analyzing candidate:", error);
    return null;
  }
};

export const generateResumeOverview = async (applicant: Applicant, resumeText?: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "AI Service Unavailable";

  try {
    const prompt = `
      You are a Senior Technical Recruiter. Create a concise "Resume Overview" for this candidate.
      
      If resume text is provided below, prioritize it. If not, synthesize the profile based on their technical responses and portfolio data.

      Candidate: ${applicant.fullName}
      Role: Senior Full Stack Developer (React/Node/Postgres)
      
      ${resumeText ? `RESUME TEXT:\n${resumeText}\n` : ''}
      
      KNOWN PROFILE DATA:
      - Skills: TS (${applicant.ratingTS}), Node (${applicant.ratingNode}), React (${applicant.ratingReact}), SQL (${applicant.ratingSQL})
      - Cloud: ${applicant.cloudProviders}
      - Project/Portfolio: ${applicant.portfolio}
      - Architecture Style (from quiz): ${applicant.scenarioIsolation} / ${applicant.scenarioIngestion}

      OUTPUT FORMAT:
      Generate a Markdown formatted summary with these sections:
      ### 📄 Professional Summary
      (2-3 sentences highlighting experience level and core stack)

      ### 🛠 Technical Skillset
      (Bulleted list of verified skills based on their detailed answers and ratings)

      ### 💼 Experience & Projects
      (Summary of their portfolio or implicit experience from their architectural choices)

      ### 🎓 Education & Certs
      (If found in text, otherwise omit)

      ### 🎯 Quick Verdict
      (One sentence recommendation)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Could not generate resume overview.";
  } catch (error) {
    console.error("Error generating resume overview:", error);
    return "Error generating resume overview.";
  }
};

export const generateEmail = async (applicant: Applicant, type: 'rejection' | 'interview'): Promise<string> => {
    const ai = getClient();
    if (!ai) return "";
  
    try {
      const prompt = type === 'interview' 
        ? `Draft a friendly interview invitation email for ${applicant.fullName}. Mention we were impressed by their answer regarding ${applicant.scenarioState.substring(0, 20)}... and their experience with ${applicant.ratingReact} React skills.`
        : `Draft a polite and professional rejection email for ${applicant.fullName}. Keep it concise, encouraging, and wish them luck.`;
  
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
  
      return response.text || "Could not generate email.";
    } catch (error) {
      console.error("Error generating email:", error);
      return "Error generating email.";
    }
  };