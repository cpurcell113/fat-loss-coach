import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 30; // seconds — raise above default 10s for slower responses

// Vercel serverless function — API key stays server-side, never in the browser bundle
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server API key not configured' });
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create(req.body);
    return res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
