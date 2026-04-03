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

  const { prompt, useIdeogram } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.length > 300) {
    return res.status(400).json({ error: 'Invalid prompt' });
  }

  try {
    let imageUrl;

    if (useIdeogram) {
      const ideogramPrompt = `Educational diagram for children, labeled illustration, clear and colorful, cartoon style, white background: ${prompt}`;
      const response = await fetch('https://fal.run/fal-ai/ideogram/v2', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: ideogramPrompt,
          aspect_ratio: '4:3',
          style_type: 'ILLUSTRATION',
          magic_prompt_option: 'OFF',
        }),
      });
      const data = await response.json();
      imageUrl = data?.images?.[0]?.url;
    } else {
      const safePrompt = `Simple educational illustration for children, cute cartoon style, colorful, absolutely no text, no labels, no words, no letters, no captions, no annotations, white background: ${prompt}`;
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
      imageUrl = data?.images?.[0]?.url;
    }

    if (!imageUrl) return res.status(500).json({ error: 'No image generated' });

    return res.status(200).json({ url: imageUrl });
  } catch (err) {
    console.error('Image generation error:', err);
    return res.status(500).json({ error: 'Generation failed' });
  }
}
