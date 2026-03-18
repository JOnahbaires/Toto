export default async function handler(req, res) {
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://toto-rust.vercel.app';
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'API key not configured on server' } });
  }
  try {
    const { system, messages } = req.body;
    if (!system || typeof system !== 'string') {
      return res.status(400).json({ error: { message: 'Invalid system prompt' } });
    }
    if (!messages || !Array.isArray(messages) || messages.length > 40) {
      return res.status(400).json({ error: { message: 'Invalid messages format' } });
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system,
        messages,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}
