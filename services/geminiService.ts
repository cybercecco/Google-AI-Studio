
import { GoogleGenAI, Type } from "@google/genai";
import { Language, SecurityTip } from "../types";

export const getSecurityAdvice = async (query: string, lang: Language = 'en') => {
  try {
    // Correctly initialize GoogleGenAI inside the function as per SDK recommendations
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langInstructions = lang === 'it' ? "Rispondi esclusivamente in lingua italiana." : "Respond exclusively in English.";
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a cybersecurity expert. ${langInstructions} Provide clear, concise advice for the following user concern: "${query}". Keep it professional and focused on best practices.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });
    // Use the .text property to access the generated content
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return lang === 'it' 
      ? "Spiacente, non ho potuto elaborare la richiesta. Controlla la connessione."
      : "I'm sorry, I couldn't process your request right now. Please check your connection.";
  }
};

export const getPasswordSuggestions = async (lang: Language = 'en') => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const langInstructions = lang === 'it' ? "Genera suggerimenti in italiano." : "Generate suggestions in English.";
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${langInstructions} Suggest 3 unique, highly secure passphrases. Explain why they are strong.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    passphrase: { type: Type.STRING },
                    reason: { type: Type.STRING }
                },
                required: ["passphrase", "reason"]
            }
          }
        }
      });
      // Extract string output via property and trim for safe parsing
      const jsonStr = (response.text || "").trim();
      return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error fetching password suggestions:", error);
        return [];
    }
};

export const getSecurityTip = async (lang: Language = 'en'): Promise<SecurityTip | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langInstructions = lang === 'it' ? "in Italian" : "in English";
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a single, unique, and actionable cybersecurity tip or best practice regarding modern threats (e.g. phishing, ransomware, password hygiene) ${langInstructions}. Return it as a JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A short, catchy title for the tip" },
            description: { type: Type.STRING, description: "A 1-2 sentence explanation of the best practice" },
            severity: { type: Type.STRING, enum: ["low", "medium", "high"], description: "The importance level of this advice" }
          },
          required: ["title", "description", "severity"]
        }
      }
    });

    const jsonStr = (response.text || "").trim();
    return JSON.parse(jsonStr) as SecurityTip;
  } catch (error) {
    console.error("Error fetching security tip:", error);
    return {
      title: lang === 'it' ? "Proteggi i tuoi dati" : "Protect your data",
      description: lang === 'it' ? "Attiva sempre l'autenticazione a due fattori (2FA) ove possibile." : "Always enable Two-Factor Authentication (2FA) whenever possible.",
      severity: "high"
    };
  }
};
