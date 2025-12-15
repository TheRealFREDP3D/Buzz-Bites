import { GoogleGenAI } from "@google/genai";
import { Faction } from '../types';
import { FALLBACK_QUOTES } from '../constants';

let ai: GoogleGenAI | null = null;

try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (error) {
  console.warn("Gemini Client initialization failed", error);
}

const getRandomFallback = () => {
  return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
};

export const generateBattleCommentary = async (
  winningFaction: Faction,
  recentAction: string,
  territory: number
): Promise<string> => {
  if (!ai) {
    return getRandomFallback();
  }

  const prompt = `
    Context: A cartoonish war between Bees and Ants in a backyard.
    Current State: ${winningFaction} are winning (Control: ${territory}%).
    Recent Action: ${recentAction}.
    
    Task: Write a ONE sentence, hilarious, sports-commentator style shout about this situation. 
    Make it puns, exaggerated, and funny. Mention backyard items like lawnmowers, hoses, picnics, or flowers.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.9,
        maxOutputTokens: 60,
      }
    });
    return response.text || getRandomFallback();
  } catch (error: any) {
    // Robustly handle 429/Resource Exhausted errors by checking various error properties
    const errString = JSON.stringify(error);
    const isQuotaError = 
        error?.status === 429 || 
        error?.status === 'RESOURCE_EXHAUSTED' ||
        errString.includes('429') ||
        errString.includes('RESOURCE_EXHAUSTED');

    if (isQuotaError) {
      console.warn("Gemini API Quota Exceeded. Switching to local commentary fallbacks.");
    } else {
      console.error("Gemini API Error:", error);
    }
    return getRandomFallback();
  }
};

export const generateVictoryMessage = async (winner: Faction): Promise<string> => {
   if (!ai) {
    return `${winner} have conquered the backyard!`;
  }

  const prompt = `
    The war is over. The ${winner} colony has completely conquered the backyard.
    Write a funny, triumphant 2-sentence speech from the perspective of the ${winner} Queen/General.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || `${winner} Wins!`;
  } catch (error: any) {
    const errString = JSON.stringify(error);
    const isQuotaError = 
        error?.status === 429 || 
        error?.status === 'RESOURCE_EXHAUSTED' ||
        errString.includes('429') ||
        errString.includes('RESOURCE_EXHAUSTED');

    if (isQuotaError) {
        console.warn("Gemini API Quota Exceeded for Victory Message. Using fallback.");
    }
    return `The ${winner} Colony reigns supreme! The backyard is theirs!`;
  }
};