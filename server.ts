/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore/lite';
import LZString from 'lz-string';
import dotenv from 'dotenv';
import firebaseConfig from './firebase-applet-config.json';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of the Gemini client to avoid crashes if the key is missing
let aiClient: GoogleGenAI | null = null;

// Initialize Firebase for server-side administrative querying
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const serverDb = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

// Administrative Security Configuration
const AUTHORIZED_ADMIN_EMAIL = 'cobaltmacawgames@gmail.com';
const DEFAULT_ADMIN_PASSKEY = 'Horizon#Admin2026!';

// In-memory store for active admin sessions: token -> { email, expiresAt }
const adminSessions = new Map<string, { email: string; expiresAt: number }>();

// In-memory rate limiting for login attempts by IP to prevent brute force
const adminLoginAttempts = new Map<string, { attempts: number; lockUntil: number }>();

function getRequestIP(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Admin Console Authentication:
 * Requires verified admin email AND security passkey (from process.env.ADMIN_ACCESS_KEY or default).
 * Includes IP brute-force lockout protection.
 */
app.post('/api/admin/login', (req, res) => {
  const ip = getRequestIP(req);
  const now = Date.now();
  const lock = adminLoginAttempts.get(ip);

  if (lock && lock.lockUntil > now) {
    const minutesLeft = Math.ceil((lock.lockUntil - now) / 60000);
    return res.status(429).json({ 
      error: `Too many failed attempts. Console locked for ${minutesLeft} minute(s) for security.` 
    });
  }

  const { email, passkey } = req.body || {};
  const targetPasskey = process.env.ADMIN_ACCESS_KEY || DEFAULT_ADMIN_PASSKEY;

  const emailMatches = typeof email === 'string' && email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
  const passkeyMatches = typeof passkey === 'string' && passkey.trim() === targetPasskey.trim();

  if (!emailMatches || !passkeyMatches) {
    const current = lock && lock.lockUntil <= now ? { attempts: 0, lockUntil: 0 } : (lock || { attempts: 0, lockUntil: 0 });
    current.attempts += 1;
    if (current.attempts >= 5) {
      current.lockUntil = now + 15 * 60 * 1000; // 15-minute lock
      adminLoginAttempts.set(ip, current);
      return res.status(429).json({ 
        error: 'Too many failed login attempts. Access is locked for 15 minutes.' 
      });
    }
    adminLoginAttempts.set(ip, current);
    const attemptsLeft = 5 - current.attempts;
    return res.status(401).json({ 
      error: `Invalid credentials. (${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before temporary lock)` 
    });
  }

  // Clear failed attempt tracking upon successful authentication
  adminLoginAttempts.delete(ip);

  // Issue cryptographic session token valid for 4 hours
  const token = crypto.randomUUID();
  const expiresAt = now + 4 * 60 * 60 * 1000;
  adminSessions.set(token, {
    email: AUTHORIZED_ADMIN_EMAIL,
    expiresAt,
  });

  return res.json({
    ok: true,
    token,
    email: AUTHORIZED_ADMIN_EMAIL,
    expiresAt,
  });
});

app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (token) {
    adminSessions.delete(token);
  }
  res.json({ ok: true });
});

/**
 * Admin Console Records Retrieval:
 * Secure server-side query to Firestore, strictly gated by the verified admin session token.
 */
app.get('/api/admin/records', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const now = Date.now();

  const session = token ? adminSessions.get(token) : null;
  if (!session || session.expiresAt < now) {
    if (token) adminSessions.delete(token);
    return res.status(401).json({ 
      error: 'Unauthorized or session expired. Please sign in with your admin credentials.' 
    });
  }

  try {
    const colRef = collection(serverDb, 'sync_backups');
    const q = query(colRef, limit(500));
    const snap = await getDocs(q);

    const items: any[] = [];
    snap.forEach((d) => {
      const raw = d.data();
      let payload = raw.data || {};
      if (raw.compressed && typeof raw.cdata === 'string') {
        try {
          const decompressed = LZString.decompressFromBase64(raw.cdata);
          if (decompressed) payload = JSON.parse(decompressed);
        } catch {}
      }
      items.push({
        syncCode: raw.syncCode || d.id,
        data: payload,
        updatedAt: raw.updatedAt,
        version: raw.version,
        origin: raw.origin || 'unknown',
        appVersion: raw.appVersion || 'legacy',
        compressed: !!raw.compressed,
        rawBytes: raw.rawBytes,
        compressedBytes: raw.compressedBytes,
      });
    });

    items.sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });

    res.json({ ok: true, records: items });
  } catch (err: any) {
    console.error('[Admin Server API] Failed to fetch sync records:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch recovery records' });
  }
});

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
        ? `Sólo por hoy, me doy permiso para respirar hondo, liberar la tensión y dar la bienvenida al equilibrio.`
        : language === 'Portuguese' || language === 'Português'
        ? `Só por hoje, dou-me permissão para respirar fundo, libertar a tensão e acolher o equilíbrio.`
        : `Just for today, I give myself permission to take a deep breath, release tension, and welcome balance.`,
      limitReached: !isAllowed,
      currentCount: Math.min(currentCount, 3)
    });
  }

  try {
    const systemPrompt = `You are a serene, highly-compassionate mindfulness and recovery guide for the Horizon recovery app.
Based on the user's current mood, generate a single, elegant, comforting daily intention or mantra.
The mantra should be short (1 sentence), powerful, deeply grounded, and reassuring.
When possible, start the focus message with:
- "Just for today, ..." (if language is English)
- "Sólo por hoy, ..." (if language is Spanish / Español)
- "Só por hoje, ..." (if language is Portuguese / Português)
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
        : language === 'Portuguese' || language === 'Português'
        ? `As suas reflexões da tarde refletem um espaço de conexão e serenidade. Continue a priorizar os seus rituais matinais e exercícios de respiração.`
        : `Your afternoon reflections show a quiet space of connection and calm. Keep prioritizing your morning rituals and breathing exercises.`,
      limitReached: !isAllowed || !ai,
      currentCount: Math.min(currentCount, 3)
    });
  }

  try {
    const journalText = reflections.map((r: any) => `[${r.date}] Title: ${r.title}\nMoods: ${r.moods?.join(', ')}\nContent: ${r.content}`).join('\n\n');

    const systemPrompt = `You are an expert recovery guide and empathetic sentiment analyst for the Horizon recovery app.
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
  // Set long-lived cache headers for static image assets to prevent unnecessary network requests
  app.use((req, res, next) => {
    if (req.path.endsWith('.png') || req.path.endsWith('.svg') || req.path.endsWith('.webp') || req.path.endsWith('.ico')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    next();
  });

  if (process.env.NODE_ENV !== 'production') {
    // In development mode, force no-cache on all document and code requests to ensure live updates
    app.use((req, res, next) => {
      if (req.path === '/' || req.path === '/index.html' || req.path === '/sw.js' || req.path.endsWith('.ts') || req.path.endsWith('.tsx') || req.path.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      next();
    });

    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: isHmrDisabled ? false : undefined,
        watch: isHmrDisabled ? null : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    // Never cache service worker or index.html to ensure PWA clients always receive current updates
    app.use((req, res, next) => {
      if (req.path === '/sw.js' || req.path === '/' || req.path === '/index.html') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      next();
    });

    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('sw.js') || filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));

    // Prevent SPA fallback for missing JS/CSS chunks so browsers don't execute HTML as JS
    app.all('/assets/*', (req, res) => {
      res.status(404).setHeader('Cache-Control', 'no-store').send('Asset not found');
    });

    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
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
