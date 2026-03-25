export default async function handler(req, res) {
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://toto-rust.vercel.app';
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);

  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'FAL_API_KEY not configured' });

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.length > 300) {
    return res.status(400).json({ error: 'Invalid prompt' });
  }

  try {
    const safePrompt = `Simple educational illustration for children, cute cartoon style, colorful, no text, white background: ${prompt}`;
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: safePrompt,
        image_size: 'landscape_4_3',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    const data = await response.json();
    const imageUrl = data?.images?.[0]?.url;
    if (!imageUrl) return res.status(500).json({ error: 'No image generated' });

    return res.status(200).json({ url: imageUrl });
  } catch (err) {
    console.error('Image generation error:', err);
    return res.status(500).json({ error: 'Generation failed' });
  }
}
