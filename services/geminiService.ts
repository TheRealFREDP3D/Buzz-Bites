import { GoogleGenAI } from "@google/genai";
import { Faction } from '../types';
import { FALLBACK_QUOTES } from '../constants';

let ai: GoogleGenAI | null = null;

try {
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  }
} catch (error) {
  console.warn("Gemini Client initialization failed", error);
}

// Rate limiting configuration
const RATE_LIMIT = {
  MIN_INTERVAL_MS: 3000, // Minimum 3 seconds between API calls
  MAX_CALLS_PER_MINUTE: 10,
  callTimestamps: [] as number[],
  lastCallTime: 0,
};

const isRateLimited = (): boolean => {
  const now = Date.now();
  
  // Check minimum interval
  if (now - RATE_LIMIT.lastCallTime < RATE_LIMIT.MIN_INTERVAL_MS) {
    return true;
  }
  
  // Clean up old timestamps (older than 1 minute)
  RATE_LIMIT.callTimestamps = RATE_LIMIT.callTimestamps.filter(
    timestamp => now - timestamp < 60000
  );
  
  // Check calls per minute
  if (RATE_LIMIT.callTimestamps.length >= RATE_LIMIT.MAX_CALLS_PER_MINUTE) {
    return true;
  }
  
  return false;
};

const recordApiCall = (): void => {
  const now = Date.now();
  RATE_LIMIT.lastCallTime = now;
  RATE_LIMIT.callTimestamps.push(now);
};

// Reset rate limiting state - useful for testing
export const resetRateLimit = (): void => {
  RATE_LIMIT.callTimestamps = [];
  RATE_LIMIT.lastCallTime = 0;
};

const getRandomFallback = (): string => {
  return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
};

const isQuotaError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  
  const err = error as Record<string, unknown>;
  let errMessage: string;
  
  try {
    errMessage = error instanceof Error ? error.message : JSON.stringify(error);
  } catch {
    // JSON.stringify can fail with circular references
    errMessage = String(error);
  }
  
  return (
    err.status === 429 || 
    err.status === 'RESOURCE_EXHAUSTED' ||
    errMessage.includes('429') ||
    errMessage.includes('RESOURCE_EXHAUSTED')
  );
};

export const generateBattleCommentary = async (
  winningFaction: Faction,
  recentAction: string,
  territory: number
): Promise<string> => {
  // Early return if no AI client or rate limited
  if (!ai || isRateLimited()) {
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
    recordApiCall();
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.9,
        maxOutputTokens: 60,
      }
    });
    return response.text || getRandomFallback();
  } catch (error: unknown) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Quota Exceeded. Switching to local commentary fallbacks.");
    } else {
      console.error("Gemini API Error:", error);
    }
    return getRandomFallback();
  }
};

export const generateVictoryMessage = async (winner: Faction): Promise<string> => {
  const fallbackMessage = `The ${winner} Colony reigns supreme! The backyard is theirs!`;
  
  // Early return if no AI client or rate limited
  if (!ai || isRateLimited()) {
    return fallbackMessage;
  }

  const prompt = `
    The war is over. The ${winner} colony has completely conquered the backyard.
    Write a funny, triumphant 2-sentence speech from the perspective of the ${winner} Queen/General.
  `;

  try {
    recordApiCall();
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || `${winner} Wins!`;
  } catch (error: unknown) {
    if (isQuotaError(error)) {
      console.warn("Gemini API Quota Exceeded for Victory Message. Using fallback.");
    } else {
      console.error("Gemini API Error:", error);
    }
    return fallbackMessage;
  }
};