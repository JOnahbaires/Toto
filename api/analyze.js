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

  const githubToken = process.env.GITHUB_TOKEN;

  try {
    const { alumno_nombre, mood, materia, tarea, transcript, fecha } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: { message: 'Missing transcript' } });
    }

    // Guardar transcript en GitHub
    let githubSaved = false;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
    const safeName = (alumno_nombre || 'anonimo').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    const fileName = `docs/analyses/${dateStr}_${timeStr}_${safeName}.md`;

    if (githubToken) {
      try {
        const fileContent = `# Sesión — ${fecha || dateStr}
## status: pending

## Datos
- **Alumno:** ${alumno_nombre || 'Sin nombre'}
- **Mood:** ${mood || '?'}
- **Materia:** ${materia || 'General'}
- **Tarea:** ${tarea || 'Sin especificar'}
- **Fecha:** ${fecha || dateStr}

## Transcripción

${transcript}
`;
        const contentB64 = Buffer.from(fileContent).toString('base64');
        const ghRes = await fetch(`https://api.github.com/repos/JOnahbaires/Toto/contents/${fileName}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github+json',
          },
          body: JSON.stringify({
            message: `session: ${safeName} — ${materia || 'general'} (${dateStr})`,
            content: contentB64,
          }),
        });

        if (ghRes.ok) {
          githubSaved = true;
          console.log('[Toto] Transcript guardado en repo:', fileName);
        } else {
          const ghErr = await ghRes.json();
          console.warn('[Toto] Error guardando en GitHub:', ghErr.message);
        }
      } catch (ghErr) {
        console.warn('[Toto] GitHub save failed:', ghErr);
      }
    }

    return res.status(200).json({ success: true, github_saved: githubSaved, file: fileName });
  } catch (err) {
    console.error('Analyze handler error:', err);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}
