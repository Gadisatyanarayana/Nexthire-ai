import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure you have process.env.GEMINI_API_KEY set in your .env.local
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// For standard text generation / reasoning
export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// For heavier parsing / reasoning
export const proModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
