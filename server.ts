/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of the Gemini client to avoid crashes if the key is missing
let aiClient: GoogleGenAI | null = null;

// Simple server-side memory registry to track IP usage per day
const ipUsageStore = new Map<string, { date: string; count: number }>();

function checkIPLimit(req: express.Request): { isAllowed: boolean; currentCount: number } {
  // Try to find the user's IP (accounting for proxies in production environments)
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const today = new Date().toISOString().split('T')[0];
  
  const record = ipUsageStore.get(ip);
  if (!record || record.date !== today) {
    // Reset or initialize count for today
    ipUsageStore.set(ip, { date: today, count: 1 });
    return { isAllowed: true, currentCount: 1 };
  }
  
  if (record.count >= 3) {
    return { isAllowed: false, currentCount: record.count };
  }
  
  record.count += 1;
  ipUsageStore.set(ip, record);
  return { isAllowed: true, currentCount: record.count };
}

function getAI() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      console.warn('GEMINI_API_KEY is not configured or has a placeholder value. Falling back to serene default text generation.');
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API Routes FIRST

/**
 * Endpoint to generate a customized serene daily intention based on user mood
 */
app.post('/api/ai/intention', async (req, res) => {
  const { mood, language } = req.body;
  
  const { isAllowed, currentCount } = checkIPLimit(req);
  const ai = isAllowed ? getAI() : null;

  if (!ai) {
    // Fallback if Gemini key is missing OR if rate limit has been exceeded
    return res.json({
      intention: language === 'Spanish' || language === 'Español'
        ? `Me doy permiso para respirar hondo, liberar la tensión y dar la bienvenida al equilibrio.`
        : `I give myself permission to take a deep breath, release tension, and welcome balance.`,
      limitReached: !isAllowed,
      currentCount: Math.min(currentCount, 3)
    });
  }

  try {
    const systemPrompt = `You are a serene, highly-compassionate mindfulness and recovery guide for a digital sanctuary app.
Based on the user's current mood, generate a single, elegant, comforting daily intention or mantra.
The mantra should be short (1 sentence), powerful, deeply grounded, and reassuring.
Do NOT use sales pitchy words, self-praising jargon, or cheesy language. Keep it very quiet and meditative.
Generate the response strictly in the requested language: ${language || 'English'}.
Do NOT output anything other than the single sentence mantra itself. No quotes, no markdown wrappers.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `The user's current mood is: ${mood || 'Calm'}. Provide a comforting daily intention.`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
      }
    });

    const intention = response.text?.trim() || '';
    res.json({ 
      intention,
      limitReached: false,
      currentCount
    });
  } catch (error: any) {
    console.error('Gemini Intention Error:', error);
    res.status(500).json({ error: 'AI generation failed' });
  }
});

/**
 * Endpoint to analyze recent reflections and generate beautiful, personalized recovery insights
 */
app.post('/api/ai/insights', async (req, res) => {
  const { reflections, language } = req.body;
  
  const { isAllowed, currentCount } = checkIPLimit(req);
  const ai = isAllowed ? getAI() : null;

  if (!ai || !reflections || reflections.length === 0) {
    return res.json({
      insights: language === 'Spanish' || language === 'Español'
        ? `Tus reflexiones de la tarde reflejan un espacio de conexión y calma. Sigue priorizando tu rutina matutina y tu meditación.`
        : `Your afternoon reflections show a quiet space of connection and calm. Keep prioritizing your morning rituals and breathing exercises.`,
      limitReached: !isAllowed || !ai,
      currentCount: Math.min(currentCount, 3)
    });
  }

  try {
    const journalText = reflections.map((r: any) => `[${r.date}] Title: ${r.title}\nMoods: ${r.moods?.join(', ')}\nContent: ${r.content}`).join('\n\n');

    const systemPrompt = `You are an expert recovery guide and empathetic sentiment analyst for a spiritual sanctuary.
Review the user's recent journal reflections and mood logs.
Generate a gentle, compassionate, and highly supportive sentiment insight of exactly 2-3 sentences.
Highlight their emotional patterns, congratulate them on their self-awareness, and offer a soft, encouraging word for their journey.
Use humble, comforting words. Do NOT speak like a machine, do NOT output lists, and avoid using clinical jargon.
Generate the response strictly in the requested language: ${language || 'English'}.
Do NOT output any surrounding text. Just the 2-3 sentence paragraph.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analyze the following user reflections and summarize their insights:\n\n${journalText}`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    const insights = response.text?.trim() || '';
    res.json({ 
      insights,
      limitReached: false,
      currentCount
    });
  } catch (error: any) {
    console.error('Gemini Insights Error:', error);
    res.status(500).json({ error: 'AI insights generation failed' });
  }
});

// Setup Vite or static files serving based on environment
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Server setup failed:', err);
});
