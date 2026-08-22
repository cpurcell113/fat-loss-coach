import Anthropic from '@anthropic-ai/sdk';
import { checkAiAccess } from './ai-guard';

export const maxDuration = 30;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const guard = checkAiAccess(req);
  if (!guard.allowed) {
    return res.status(guard.status).json({ error: guard.error });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server API key not configured' });
  }

  if (guard.remaining != null) {
    res.setHeader('X-AI-Remaining', String(guard.remaining));
  }
  if (guard.limit != null) {
    res.setHeader('X-AI-Limit', String(guard.limit));
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
