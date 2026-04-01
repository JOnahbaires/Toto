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
  if (!anthropicKey || !resendKey) {
    return res.status(500).json({ error: 'API keys not configured' });
  }

  const { alumno_nombre, grado, materia, tarea, parent_email, fecha } = req.body;
  if (!parent_email || !alumno_nombre || !tarea) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const materiaLabel = {
    matematica: 'Matemática',
    lengua: 'Lengua',
    ingles: 'Inglés',
    naturales: 'Ciencias Naturales',
    sociales: 'Ciencias Sociales',
    otra: 'Otra materia'
  }[materia] || materia || 'la materia';

  // Generar flashcards con Claude Haiku
  let flashcards = [];
  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Sos un asistente educativo para primaria argentina.
El alumno se llama ${alumno_nombre}, está en ${grado}° grado, y trabajó hoy en: "${tarea}" (materia: ${materiaLabel}).

Generá exactamente 5 flashcards de repaso para que el padre las use con el hijo.
Basate en el tema "${tarea}" y en el currículo CABA 2025 para ${grado}° grado de ${materiaLabel}.

Respondé ÚNICAMENTE con un array JSON válido, sin texto adicional, sin markdown:
[
  { "pregunta": "...", "respuesta": "..." },
  { "pregunta": "...", "respuesta": "..." },
  { "pregunta": "...", "respuesta": "..." },
  { "pregunta": "...", "respuesta": "..." },
  { "pregunta": "...", "respuesta": "..." }
]

Las preguntas deben:
- Ser claras para un niño de primaria
- Tener respuestas cortas (1-2 oraciones)
- Usar lenguaje simple y directo`
        }]
      })
    });

    if (!aiRes.ok) {
      return res.status(500).json({ error: 'Error generando flashcards' });
    }
    const aiData = await aiRes.json();
    const raw = aiData.content?.[0]?.text?.trim() || '[]';
    flashcards = JSON.parse(raw);
  } catch (e) {
    return res.status(500).json({ error: 'Error procesando flashcards' });
  }

  if (!Array.isArray(flashcards) || flashcards.length === 0) {
    return res.status(500).json({ error: 'Flashcards inválidas' });
  }

  // Armar email HTML
  const cardsHtml = flashcards.map((c, i) => `
    <div style="background:#f9f8ff;border-left:4px solid #7c6fff;border-radius:8px;padding:16px 20px;margin-bottom:12px;">
      <div style="font-size:0.8rem;color:#7c6fff;font-weight:bold;margin-bottom:6px;">TARJETA ${i + 1}</div>
      <div style="font-size:1rem;font-weight:bold;color:#222;margin-bottom:8px;">❓ ${escapeHtml(c.pregunta)}</div>
      <div style="font-size:0.95rem;color:#444;">✅ ${escapeHtml(c.respuesta)}</div>
    </div>
  `).join('');

  const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;padding:20px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1);">
    <div style="background:#7c6fff;color:#fff;padding:20px 24px;">
      <h1 style="margin:0;font-size:1.1rem;">🎴 Toto el Tutor — Tarjetas de repaso</h1>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 8px;font-size:1rem;">Hola,</p>
      <p style="margin:0 0 20px;color:#444;">
        <strong>${escapeHtml(alumno_nombre)}</strong> trabajó hoy con Toto en:
        <em>"${escapeHtml(tarea)}"</em> (${escapeHtml(materiaLabel)}, ${escapeHtml(grado)}° grado).
      </p>
      <p style="margin:0 0 16px;color:#444;">Acá van 5 tarjetas para repasar juntos cuando tengan un momento:</p>
      ${cardsHtml}
      <p style="margin:20px 0 0;font-size:0.8rem;color:#aaa;border-top:1px solid #eee;padding-top:16px;">
        Material alineado al Diseño Curricular CABA 2025 para ${escapeHtml(grado)}° grado de ${escapeHtml(materiaLabel)}.
      </p>
    </div>
    <div style="background:#f9f9f9;padding:14px 24px;text-align:center;font-size:0.75rem;color:#999;">
      Toto el Tutor — totoeltutor.com.ar
    </div>
  </div>
</body>
</html>`;

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`
      },
      body: JSON.stringify({
        from: 'Toto el Tutor <toto@totoeltutor.com.ar>',
        to: [parent_email],
        subject: `🎴 ${alumno_nombre} estudió ${materiaLabel} — tarjetas de repaso`,
        html: htmlBody
      })
    });

    if (!emailRes.ok) {
      return res.status(500).json({ error: 'Error enviando email' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
