// api/orchestrator.js — Proxy serverless para el Orchestrator de Toto
// Similar a chat.js pero con autenticación por PIN y max_tokens más alto (4000)
// La contraseña se guarda como variable de entorno en Vercel: ORCHESTRATOR_PIN

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { pin, system, messages, model } = req.body;

  // Verificar PIN
  const correctPin = process.env.ORCHESTRATOR_PIN;
  if (!correctPin || pin !== correctPin) {
    return res.status(401).json({ error: 'PIN incorrecto' });
  }

  // Verificar que hay mensajes
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Faltan mensajes' });
  }

  // Llamar a Anthropic
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key no configurada' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: system || '',
        messages: messages
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errData.error?.message || `Error de Anthropic: ${response.status}`
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: `Error interno: ${err.message}` });
  }
}
