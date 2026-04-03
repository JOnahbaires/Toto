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

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;

  if (!anthropicKey || !resendKey) {
    return res.status(500).json({ error: { message: 'API keys not configured' } });
  }

  try {
    const { alumno_nombre, mood, materia, tarea, transcript, fecha, fileName } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: { message: 'Missing transcript' } });
    }

    // Truncar transcript para respuesta rápida
    const truncated = transcript.length > 3000
      ? transcript.substring(0, 3000) + '\n[...truncado...]'
      : transcript;

    const analysisPrompt = `Sos un evaluador de pedagogía socrática. Analizá esta sesión de Toto el Tutor (tutor IA para chicos de primaria en Buenos Aires). Sé BREVE y DIRECTO.

DATOS: Alumno: ${alumno_nombre || '?'} | Mood: ${mood || '?'} | Materia: ${materia || '?'} | Tarea: ${tarea || '?'}

TRANSCRIPCIÓN:
${truncated}

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
    const timeout = setTimeout(() => controller.abort(), 12000);

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

    const analysisData = await analysisRes.json();
    if (!analysisRes.ok) {
      console.error('[Toto] Anthropic analysis error:', JSON.stringify(analysisData));
      return res.status(500).json({ error: { message: 'Analysis failed', detail: analysisData?.error?.message } });
    }

    const analysis = analysisData.content?.[0]?.text || 'No se pudo generar el análisis.';

    // Actualizar archivo en GitHub con el análisis (si tenemos fileName y token)
    let githubUpdated = false;
    if (githubToken && fileName) {
      const fullContent = `# Análisis Post-Sesión — ${fecha || ''}
## status: pending

## Datos
- **Alumno:** ${alumno_nombre || 'Sin nombre'}
- **Mood:** ${mood || '?'}
- **Materia:** ${materia || 'General'}
- **Tarea:** ${tarea || 'Sin especificar'}
- **Fecha:** ${fecha || ''}

## Análisis

${analysis}

## Transcripción

${transcript}
`;
      try {
        // Intentar obtener el archivo existente para actualizar
        const getRes = await fetch(`https://api.github.com/repos/JOnahbaires/Toto/contents/${fileName}`, {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github+json',
          },
        });

        const putBody = {
          message: `analysis: add scores (${fileName.split('/').pop()})`,
          content: Buffer.from(fullContent).toString('base64'),
        };

        if (getRes.ok) {
          // Archivo existe → actualizar con SHA
          const fileData = await getRes.json();
          putBody.sha = fileData.sha;
        }
        // Si no existe (404) → crear desde cero sin SHA

        const putRes = await fetch(`https://api.github.com/repos/JOnahbaires/Toto/contents/${fileName}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github+json',
          },
          body: JSON.stringify(putBody),
        });
        githubUpdated = putRes.ok;
        if (!putRes.ok) {
          const errData = await putRes.json().catch(() => ({}));
          console.warn('[Toto] GitHub PUT failed:', errData.message);
        }
      } catch (e) {
        console.warn('[Toto] GitHub update failed:', e);
      }
    }

    // Enviar email
    const htmlBody = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1);">
<div style="background:#ff6b8a;color:#fff;padding:20px 24px;">
<h1 style="margin:0;font-size:1.3rem;">🔬 Análisis — ${esc(alumno_nombre)} (${esc(materia)})</h1></div>
<div style="padding:24px;font-size:0.9rem;line-height:1.7;color:#333;white-space:pre-wrap;">${esc(analysis)}</div>
<div style="background:#f9f9f9;padding:14px 24px;text-align:center;font-size:0.75rem;color:#999;">
Análisis por Claude Haiku — GitHub: ${githubUpdated ? '✅ Guardado' : '❌ ARCHIVO NO GUARDADO EN REPO'}</div>
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

    return res.status(200).json({ success: true, github_updated: githubUpdated });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: { message: 'Analysis timed out' } });
    }
    console.error('[Toto] analyze-report error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: { message: 'Internal server error' } });
    }
  }
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
