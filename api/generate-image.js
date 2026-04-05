const WIKIPEDIA_SVG_MAP = {
  // corazón
  'heart': 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Diagram_of_the_human_heart_%28cropped%29.svg',
  'corazon': 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Diagram_of_the_human_heart_%28cropped%29.svg',
  'corazón': 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Diagram_of_the_human_heart_%28cropped%29.svg',
  // célula
  'cell': 'https://upload.wikimedia.org/wikipedia/commons/3/37/Animal_cell_structure_en.svg',
  'celula': 'https://upload.wikimedia.org/wikipedia/commons/3/37/Animal_cell_structure_en.svg',
  'célula': 'https://upload.wikimedia.org/wikipedia/commons/3/37/Animal_cell_structure_en.svg',
  'animal cell': 'https://upload.wikimedia.org/wikipedia/commons/3/37/Animal_cell_structure_en.svg',
  // capas de la tierra
  'earth layers': 'https://upload.wikimedia.org/wikipedia/commons/0/00/Earth_poster.svg',
  'capas de la tierra': 'https://upload.wikimedia.org/wikipedia/commons/0/00/Earth_poster.svg',
  'earth cross section': 'https://upload.wikimedia.org/wikipedia/commons/0/00/Earth_poster.svg',
  // sistema solar
  'solar system': 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Planets2013.svg',
  'sistema solar': 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Planets2013.svg',
  // ADN
  'dna': 'https://upload.wikimedia.org/wikipedia/commons/4/4c/DNA_Structure%2BKey%2BLabelled.pn_NoBB.png',
  'adn': 'https://upload.wikimedia.org/wikipedia/commons/4/4c/DNA_Structure%2BKey%2BLabelled.pn_NoBB.png',
  // fotosíntesis
  'photosynthesis': 'https://upload.wikimedia.org/wikipedia/commons/5/55/Photosynthesis_en.svg',
  'fotosintesis': 'https://upload.wikimedia.org/wikipedia/commons/5/55/Photosynthesis_en.svg',
  'fotosíntesis': 'https://upload.wikimedia.org/wikipedia/commons/5/55/Photosynthesis_en.svg',
  // sistema digestivo
  'digestive system': 'https://upload.wikimedia.org/wikipedia/commons/4/41/Blausen_0316_DigestiveSystem.png',
  'sistema digestivo': 'https://upload.wikimedia.org/wikipedia/commons/4/41/Blausen_0316_DigestiveSystem.png',
  // sistema respiratorio
  'respiratory system': 'https://upload.wikimedia.org/wikipedia/commons/b/be/Respiratory_system_complete_en.svg',
  'sistema respiratorio': 'https://upload.wikimedia.org/wikipedia/commons/b/be/Respiratory_system_complete_en.svg',
  // ojo
  'eye': 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Schematic_diagram_of_the_human_eye_en.svg',
  'ojo': 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Schematic_diagram_of_the_human_eye_en.svg',
  // cerebro
  'brain': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/24701-anatomy-of-the-brain.svg',
  'cerebro': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/24701-anatomy-of-the-brain.svg',
};

function findWikipediaSvg(prompt) {
  const lower = prompt.toLowerCase().trim();
  for (const [key, url] of Object.entries(WIKIPEDIA_SVG_MAP)) {
    if (lower.includes(key)) return url;
  }
  return null;
}

async function generateSvgWithHaiku(prompt, labels, apiKey) {
  const labelList = labels
    ? labels.split(',').map(l => l.trim()).filter(Boolean).join(', ')
    : '';
  const svgPrompt = `Draw a simple educational SVG diagram for children about: "${prompt}".
${labelList ? `Include these labeled parts clearly visible: ${labelList}.` : ''}
Requirements:
- Return ONLY valid SVG code, no explanation, no markdown
- Width 400, height 300
- Clean cartoon style, colorful, no complex details
- Labels must be in Spanish, clearly readable, font-size 12-14px
- Use bright colors for different parts
- Simple shapes only`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: svgPrompt }],
    }),
  });
  const data = await response.json();
  const text = data?.content?.[0]?.text || '';
  // extraer solo el bloque SVG
  const svgMatch = text.match(/<svg[\s\S]*<\/svg>/i);
  return svgMatch ? svgMatch[0] : null;
}

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

  const { prompt, useIdeogram, useLabeled, labels } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.length > 400) {
    return res.status(400).json({ error: 'Invalid prompt' });
  }

  try {
    // Modo etiquetado: Wikipedia SVG → Claude Haiku SVG → fallback Flux
    if (useLabeled) {
      const wikiUrl = findWikipediaSvg(prompt);
      if (wikiUrl) {
        // Wikipedia images already have their own labels — don't show the legend
        return res.status(200).json({ type: 'image-url', url: wikiUrl });
      }

      if (process.env.ANTHROPIC_API_KEY) {
        const svg = await generateSvgWithHaiku(prompt, labels, process.env.ANTHROPIC_API_KEY);
        if (svg) {
          return res.status(200).json({ type: 'svg-inline', svg, labels });
        }
      }

      // fallback: Flux sin etiquetas si todo falla
      const safePrompt = `Simple educational illustration for children, cute cartoon style, colorful, absolutely no text, no labels, white background: ${prompt}`;
      const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: safePrompt, image_size: 'landscape_4_3', num_inference_steps: 4, num_images: 1, enable_safety_checker: true }),
      });
      const data = await response.json();
      const url = data?.images?.[0]?.url;
      if (!url) return res.status(500).json({ error: 'No image generated' });
      return res.status(200).json({ type: 'image-url', url, labels });
    }

    // Modo Ideogram (etiquetado viejo — mantenido por compatibilidad)
    if (useIdeogram) {
      const ideogramPrompt = `Educational diagram for children, labeled illustration, clear and colorful, cartoon style, white background: ${prompt}`;
      const response = await fetch('https://fal.run/fal-ai/ideogram/v2', {
        method: 'POST',
        headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: ideogramPrompt, aspect_ratio: '4:3', style_type: 'ILLUSTRATION', magic_prompt_option: 'OFF' }),
      });
      const data = await response.json();
      const url = data?.images?.[0]?.url;
      if (!url) return res.status(500).json({ error: 'No image generated' });
      return res.status(200).json({ type: 'image-url', url });
    }

    // Modo Flux simple (sin etiquetas)
    const safePrompt = `Simple educational illustration for children, cute cartoon style, colorful, absolutely no text, no labels, no words, no letters, no captions, no annotations, white background: ${prompt}`;
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: safePrompt, image_size: 'landscape_4_3', num_inference_steps: 4, num_images: 1, enable_safety_checker: true }),
    });
    const data = await response.json();
    const url = data?.images?.[0]?.url;
    if (!url) return res.status(500).json({ error: 'No image generated' });
    return res.status(200).json({ type: 'image-url', url });

  } catch (err) {
    console.error('Image generation error:', err);
    return res.status(500).json({ error: 'Generation failed' });
  }
}
