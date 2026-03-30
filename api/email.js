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

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(500).json({ error: { message: 'Email API key not configured' } });
  }

  try {
    const {
      alumno_nombre, mood, materia, tarea, fecha,
      duracion_total, tiempo_promedio, total_mensajes,
      pistas, xp, subio_foto, conversacion, edad, grado,
      fileName
    } = req.body;

    if (!alumno_nombre || !conversacion) {
      return res.status(400).json({ error: { message: 'Missing required fields' } });
    }

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1);">
    <div style="background:#7c6fff;color:#fff;padding:20px 24px;">
      <h1 style="margin:0;font-size:1.3rem;">🎓 Toto el Tutor — Reporte de Sesión</h1>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
        <tr><td style="padding:6px 0;color:#666;width:140px;">Alumno</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(alumno_nombre)}</td></tr>
        ${edad ? `<tr><td style="padding:6px 0;color:#666;">Edad</td><td style="padding:6px 0;">${escapeHtml(edad)}</td></tr>` : ''}
        ${grado ? `<tr><td style="padding:6px 0;color:#666;">Grado</td><td style="padding:6px 0;">${escapeHtml(grado)}</td></tr>` : ''}
        <tr><td style="padding:6px 0;color:#666;">Estado emocional</td><td style="padding:6px 0;">${escapeHtml(mood)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Materia</td><td style="padding:6px 0;">${escapeHtml(materia)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Tarea/Tema</td><td style="padding:6px 0;">${escapeHtml(tarea)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Fecha</td><td style="padding:6px 0;">${escapeHtml(fecha)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Duración</td><td style="padding:6px 0;">${escapeHtml(duracion_total)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Mensajes</td><td style="padding:6px 0;">${escapeHtml(total_mensajes)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Pistas</td><td style="padding:6px 0;">${escapeHtml(pistas)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Estrellas</td><td style="padding:6px 0;">⭐ ${escapeHtml(xp)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Subió foto</td><td style="padding:6px 0;">${escapeHtml(subio_foto)}</td></tr>
      </table>

      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
      <h2 style="font-size:1rem;color:#7c6fff;margin-bottom:12px;">💬 Conversación</h2>
      ${formatConversation(conversacion, alumno_nombre, 30, fileName)}
    </div>
    <div style="background:#f9f9f9;padding:14px 24px;text-align:center;font-size:0.75rem;color:#999;">
      Toto el Tutor — Reporte automático
    </div>
  </div>
</body>
</html>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'Toto el Tutor <onboarding@resend.dev>',
        to: ['jonah.baires@gmail.com'],
        subject: `📊 Sesión: ${alumno_nombre} — ${materia} (${fecha})`,
        html: htmlBody,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(response.status).json({ error: { message: 'Email send failed' } });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Email handler error:', err);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatConversation(transcript, alumnoName, maxMessages, fileName) {
  if (!transcript) return '<p style="color:#999;">Sin mensajes registrados</p>';
  const messages = transcript.split(/(?=^\[)/m).filter(m => m.trim());
  const total = messages.length;
  const limit = maxMessages || total;
  const shown = messages.slice(0, limit);
  let html = '';
  for (const msg of shown) {
    const trimmed = msg.trim();
    if (!trimmed) continue;
    const isToto = trimmed.startsWith('[Toto]');
    const bgColor = isToto ? '#f0eeff' : '#f5f5f5';
    const labelColor = isToto ? '#7c6fff' : '#888';
    const label = isToto ? '🤖 Toto' : `👤 ${escapeHtml(alumnoName || 'Alumno')}`;
    const text = trimmed.replace(/^\[(Toto|[^\]]+)\]:\s*/, '');
    html += `<div style="background:${bgColor};border-radius:8px;padding:10px 14px;margin-bottom:8px;">
      <div style="font-size:0.75rem;font-weight:700;color:${labelColor};margin-bottom:4px;">${label}</div>
      <div style="font-size:0.88rem;line-height:1.5;color:#333;">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
    </div>`;
  }
  if (total > limit && fileName) {
    const githubUrl = `https://github.com/JOnahbaires/Toto/blob/main/${fileName}`;
    html += `<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:14px 16px;margin-top:8px;text-align:center;">
      <p style="margin:0 0 10px;font-size:0.85rem;color:#555;">Se muestran los primeros ${limit} de ${total} mensajes.</p>
      <a href="${githubUrl}" style="display:inline-block;background:#7c6fff;color:#fff;text-decoration:none;padding:8px 18px;border-radius:6px;font-size:0.85rem;font-weight:600;">Ver conversación completa en GitHub →</a>
    </div>`;
  }
  return html || '<p style="color:#999;">Sin mensajes registrados</p>';
}
