import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini API for Bengali Voice Transaction Extraction
app.post('/api/parse-transaction', async (req, res) => {
  try {
    const { text, context } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please add your key in the AI Studio Secrets panel.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are a financial parsing assistant specialized in Bangladeshi Bengali and English personal finance terminology.
Analyze the following user voice transcription or natural text in Bengali/Banglish/English and extract structured financial transaction information.

User Input: "${text}"

Context available in user's system:
- Known accounts: ${JSON.stringify(context?.accounts || [])}
- Known categories: ${JSON.stringify(context?.categories || [])}
- Known people/beneficiaries: ${JSON.stringify(context?.people || [])}

Rules:
1. Transaction types can be: "income", "expense", "transfer", "loan_given", "loan_received", "loan_repayment_received", "loan_repayment_paid", "savings_deposit", "savings_withdrawal", "asset_purchase", "asset_sale", "refund".
   Default is "expense" unless income, transfer, or loan keywords are evident.
2. Amount: Extract the numeric amount in Bangladeshi Taka (BDT). Convert Bengali numerals (১, ২, ৩...) or text (যেমন: বারো শত -> 1200, পাঁচ হাজার -> 5000) to pure number.
3. Category: Match against standard categories (Food & Grocery, House Rent, Utilities, Electricity, Gas, Internet, Transportation, Shopping & Clothing, Medical & Healthcare, Education, Family Expense, Wife Expense, Personal Expense, Entertainment, Salary, Business Income, etc.) or provided categories.
4. Person: If mentioned (e.g. "Family", "Wife", "Wife expense", "আম্মা", "বাবা", "দোস্ত", "রহিম"), extract or match.
5. Payment Method & Account: Common Bangladeshi channels: "bKash" (বিকাশ), "Nagad" (নগদ), "Rocket" (রকেট), "DBBL", "Bank" (ব্যাংক), "Cash" (ক্যাশ / নগদ টাকা).
6. Date: If "আজকে" / "today", use today's date in YYYY-MM-DD. If "গতকাল" / "yesterday", use yesterday. Otherwise default to today.

Respond ONLY with valid JSON in this exact structure without markdown backticks:
{
  "type": "expense",
  "amount": 1200,
  "categoryName": "Food & Grocery",
  "personName": "Family",
  "paymentMethod": "bKash",
  "accountName": "bKash",
  "description": "Short Bengali/English summary",
  "note": "Optional details",
  "date": "YYYY-MM-DD",
  "confidence": 0.95
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Clean possible fences
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/parse-transaction:', error);
    return res.status(500).json({
      error: error.message || 'Failed to parse transaction',
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Vite Middleware for development
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
