export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'API key not configured on server' } });
  }
  try {
    const { system, messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: { message: 'Invalid messages format' } });
    }

    // Retry logic for overload errors (up to 2 retries)
    let lastError = null;
    for (let attempt = 0; attempt <= 2; attempt++) {
      if (attempt > 0) {
        // Wait before retry: 3s, then 6s
        await new Promise(r => setTimeout(r, attempt * 3000));
      }
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system,
          messages,
        }),
      });
      const data = await response.json();
      // If overloaded, retry
      if (response.status === 529 || data?.error?.type === 'overloaded_error') {
        lastError = data;
        continue;
      }
      return res.status(response.status).json(data);
    }
    // All retries exhausted
    return res.status(529).json(lastError || { error: { type: 'overloaded_error', message: 'El servidor está sobrecargado. Intentá en unos segundos.' } });
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: { message: err.message || 'Server error' } });
  }
}
