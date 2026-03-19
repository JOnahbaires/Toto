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
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  try {
    const { alumno_nombre, mood, materia, tarea, transcript, fecha } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: { message: 'Missing transcript' } });
    }

    // PASO 1: Guardar transcript en GitHub (rápido, ~1-2s)
    // Esto es lo prioritario — si el análisis falla, al menos el transcript queda
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

    // PASO 2: Responder al frontend YA — no hacerlo esperar al análisis
    res.status(200).json({ success: true, github_saved: githubSaved, file: fileName });

    // PASO 3: Análisis con Claude + email (fire-and-forget, después del response)
    // Esto corre en el tiempo restante del serverless function
    if (anthropicKey && resendKey) {
      try {
        // Truncar transcript para que Haiku responda rápido
        const truncatedTranscript = transcript.length > 3000
          ? transcript.substring(0, 3000) + '\n\n[...transcript truncado por límite de tiempo...]'
          : transcript;

        const analysisPrompt = `Sos un evaluador de pedagogía socrática. Analizá esta sesión de Toto el Tutor (tutor IA para chicos de primaria en Buenos Aires). Sé BREVE y DIRECTO.

DATOS: Alumno: ${alumno_nombre || '?'} | Mood: ${mood || '?'} | Materia: ${materia || '?'} | Tarea: ${tarea || '?'}

TRANSCRIPCIÓN:
${truncatedTranscript}

Respondé con este formato EXACTO (sin explicaciones extras):
SOCRÁTICO: X/10 — [una línea]
PREGUNTAS: X/10 — [una línea]
EMOCIONAL: X/10 — [una línea]
RIOPLATENSE: X/10 — [una línea]
VERIFICACIÓN: X/10 — [una línea]
ENGAGEMENT: X/10 — [una línea]
SCORE: X/10
VOLVERÍA: Sí/Probablemente/No
ERRORES: [lista breve o "Ninguno"]
CAMBIOS AL PROMPT: [sugerencias concretas o "Ninguno"]`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        const analysisRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 800,
            messages: [{ role: 'user', content: analysisPrompt }],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (analysisRes.ok) {
          const analysisData = await analysisRes.json();
          const analysis = analysisData.content?.[0]?.text || '';

          // Actualizar el archivo en GitHub con el análisis
          if (githubToken && githubSaved && analysis) {
            try {
              // Obtener SHA del archivo para actualizarlo
              const getRes = await fetch(`https://api.github.com/repos/JOnahbaires/Toto/contents/${fileName}`, {
                headers: {
                  'Authorization': `Bearer ${githubToken}`,
                  'Accept': 'application/vnd.github+json',
                },
              });
              if (getRes.ok) {
                const fileData = await getRes.json();
                const updatedContent = `# Análisis Post-Sesión — ${fecha || dateStr}
## status: pending

## Datos
- **Alumno:** ${alumno_nombre || 'Sin nombre'}
- **Mood:** ${mood || '?'}
- **Materia:** ${materia || 'General'}
- **Tarea:** ${tarea || 'Sin especificar'}
- **Fecha:** ${fecha || dateStr}

## Análisis

${analysis}

## Transcripción

${transcript}
`;
                await fetch(`https://api.github.com/repos/JOnahbaires/Toto/contents/${fileName}`, {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github+json',
                  },
                  body: JSON.stringify({
                    message: `analysis: ${safeName} — ${materia || 'general'} (${dateStr})`,
                    content: Buffer.from(updatedContent).toString('base64'),
                    sha: fileData.sha,
                  }),
                });
                console.log('[Toto] Análisis agregado al archivo:', fileName);
              }
            } catch (e) {
              console.warn('[Toto] Error actualizando análisis en GitHub:', e);
            }
          }

          // Enviar email con el análisis
          const htmlBody = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1);">
<div style="background:#ff6b8a;color:#fff;padding:20px 24px;">
<h1 style="margin:0;font-size:1.3rem;">🔬 Análisis — ${escapeHtml(alumno_nombre)} (${escapeHtml(materia)})</h1>
</div>
<div style="padding:24px;font-size:0.9rem;line-height:1.7;color:#333;white-space:pre-wrap;">${escapeHtml(analysis)}</div>
<div style="background:#f9f9f9;padding:14px 24px;text-align:center;font-size:0.75rem;color:#999;">
Análisis por Claude Haiku — Guardado en repo: ${githubSaved ? '✅' : '❌'}</div>
</div></body></html>`;

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: 'Toto Análisis <onboarding@resend.dev>',
              to: ['jonah.baires@gmail.com'],
              subject: `🔬 ${alumno_nombre} — ${materia} (${fecha})`,
              html: htmlBody,
            }),
          });
          console.log('[Toto] Email análisis enviado');
        }
      } catch (e) {
        console.warn('[Toto] Análisis/email post-response failed:', e.name === 'AbortError' ? 'timeout' : e);
      }
    }
  } catch (err) {
    console.error('Analyze handler error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: { message: 'Internal server error' } });
    }
  }
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
