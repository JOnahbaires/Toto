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
    const { alumno_nombre, mood, materia, tarea, transcript, fecha } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: { message: 'Missing transcript' } });
    }

    // Análisis externo con Claude (modelo distinto al que dio la sesión)
    const analysisPrompt = `Sos un evaluador experto en pedagogía socrática y tutoría para niños de 10-12 años.

Analizá la siguiente transcripción de una sesión de Toto el Tutor — un tutor socrático con IA para chicos de escuela primaria en Buenos Aires.

DATOS DE LA SESIÓN:
- Alumno: ${alumno_nombre || 'Sin nombre'}
- Mood al arrancar: ${mood || '?'}
- Materia: ${materia || 'General'}
- Tarea/Tema: ${tarea || 'Sin especificar'}

TRANSCRIPCIÓN:
${transcript}

═══ EVALUÁ ESTOS EJES ═══

1. **MÉTODO SOCRÁTICO** (1-10): ¿Toto hizo preguntas guía sin dar respuestas directas? ¿Respetó la escalada progresiva (preguntas → pistas → mini-explicación → explicación directa)?

2. **UNA PREGUNTA POR MENSAJE** (1-10): ¿Cumplió la regla de una línea de indagación por mensaje? ¿Mezcló objetivos distintos?

3. **MANEJO EMOCIONAL** (1-10): ¿Adaptó su tono al mood del alumno? ¿Celebró esfuerzo antes de corregir? ¿Fue empático con frustración?

4. **VOZ RIOPLATENSE** (1-10): ¿Usó "vos", "dale", "che", "crack", "piola"? ¿Sonó natural, no robótico?

5. **VERIFICACIÓN DE RESPUESTAS** (1-10): ¿Verificó si las respuestas eran correctas antes de reaccionar? ¿Dijo "casi" cuando era correcta?

6. **ENGAGEMENT** (1-10): ¿El alumno se mantuvo enganchado? ¿Hubo señales de desconexión? ¿Toto ofreció analogías/mundos cuando correspondía?

7. **ERRORES DETECTADOS**: Listá cada error específico que cometió Toto en esta sesión.

8. **CAMBIOS SUGERIDOS AL PROMPT**: Para cada error, sugerí un cambio concreto al system prompt que lo previene. Escribilo como texto listo para copiar/pegar en el prompt.

9. **SCORE GENERAL** (1-10): Nota final de la sesión.

10. **¿EL NIÑO VOLVERÍA MAÑANA?** (Sí/Probablemente/No): Basándote en el engagement y la experiencia, ¿este niño querría volver a usar Toto?

Respondé en español argentino. Sé directo y específico — no genérico.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const analysisRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: analysisPrompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const analysisData = await analysisRes.json();
    if (!analysisRes.ok) {
      console.error('Anthropic analysis error:', JSON.stringify(analysisData));
      return res.status(500).json({ error: { message: 'Analysis failed', detail: analysisData?.error?.message || 'Unknown' } });
    }

    const analysis = analysisData.content?.[0]?.text || 'No se pudo generar el análisis.';

    // Guardar análisis en el repo via GitHub API
    let githubSaved = false;
    if (githubToken) {
      try {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
        const safeName = (alumno_nombre || 'anonimo').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        const fileName = `docs/analyses/${dateStr}_${timeStr}_${safeName}.md`;

        const fileContent = `# Análisis Post-Sesión — ${fecha || dateStr}
## status: pending

## Datos de la sesión
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

        const contentB64 = Buffer.from(fileContent).toString('base64');
        const ghRes = await fetch(`https://api.github.com/repos/JOnahbaires/Toto/contents/${fileName}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github+json',
          },
          body: JSON.stringify({
            message: `analysis: ${safeName} — ${materia || 'general'} (${dateStr})`,
            content: contentB64,
          }),
        });

        if (ghRes.ok) {
          githubSaved = true;
          console.log('[Toto] Análisis guardado en repo:', fileName);
        } else {
          const ghErr = await ghRes.json();
          console.warn('[Toto] Error guardando en GitHub:', ghErr.message);
        }
      } catch (ghErr) {
        console.warn('[Toto] GitHub save failed:', ghErr);
      }
    }

    // Enviar email con el análisis
    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1);">
    <div style="background:#ff6b8a;color:#fff;padding:20px 24px;">
      <h1 style="margin:0;font-size:1.3rem;">🔬 Análisis Post-Sesión — Toto el Tutor</h1>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:0.9rem;margin-bottom:16px;">
        <tr><td style="padding:6px 0;color:#666;width:100px;">Alumno</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(alumno_nombre)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Materia</td><td style="padding:6px 0;">${escapeHtml(materia)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Tarea</td><td style="padding:6px 0;">${escapeHtml(tarea)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Fecha</td><td style="padding:6px 0;">${escapeHtml(fecha)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Guardado en repo</td><td style="padding:6px 0;">${githubSaved ? '✅ Sí' : '❌ No (sin token o error)'}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
      <div style="font-size:0.9rem;line-height:1.7;color:#333;white-space:pre-wrap;">${escapeHtml(analysis)}</div>
    </div>
    <div style="background:#f9f9f9;padding:14px 24px;text-align:center;font-size:0.75rem;color:#999;">
      Análisis generado por Claude Sonnet — Evaluador externo independiente
    </div>
  </div>
</body>
</html>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'Toto Análisis <onboarding@resend.dev>',
        to: ['jonah.baires@gmail.com'],
        subject: `🔬 Análisis: ${alumno_nombre} — ${materia} (${fecha})`,
        html: htmlBody,
      }),
    });

    const emailData = await emailRes.json();
    if (!emailRes.ok) {
      console.error('Resend analysis email error:', emailData);
      return res.status(500).json({ error: { message: 'Analysis email failed' } });
    }

    return res.status(200).json({ success: true, analysis_id: emailData.id, github_saved: githubSaved });
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('Analysis timed out');
      return res.status(504).json({ error: { message: 'Analysis timed out' } });
    }
    console.error('Analyze handler error:', err);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
