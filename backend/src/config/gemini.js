import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY");
}

export const geminiModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";
export const gemini = new GoogleGenAI({ apiKey });
