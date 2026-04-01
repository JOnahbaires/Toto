export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(500).json({ error: 'Email API key not configured' });
  }

  const { nombrePadre, emailPadre, nombreAlumno, edad, grado, whatsapp } = req.body;

  if (!nombrePadre || !emailPadre || !nombreAlumno || !edad || !grado) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const idBeta = nombreAlumno.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  const tokenData = { nombre: nombreAlumno, grado, edad: Number(edad), idBeta, tester: false, emailPadre };
  const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
  const link = `https://app.totoeltutor.com.ar/app.html?token=${token}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1);">
    <div style="background:#7c6fff;color:#fff;padding:20px 24px;">
      <h1 style="margin:0;font-size:1.2rem;">🎓 Toto el Tutor</h1>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 16px;">Hola ${escapeHtml(nombrePadre)},</p>
      <p style="margin:0 0 16px;">${escapeHtml(nombreAlumno)} ya está listo para su primera sesión con Toto.<br>
      Mandále este link desde tu celular o computadora:</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${link}"
           style="background:#7c6fff;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:1rem;display:inline-block;">
          Abrir Toto →
        </a>
      </div>
      <p style="color:#888;font-size:0.85rem;margin:0 0 8px;">O copiá este link:</p>
      <p style="background:#f5f5f5;padding:10px;border-radius:6px;font-size:0.8rem;word-break:break-all;margin:0 0 24px;">${link}</p>
      <p style="margin:0 0 8px;">Toto lo va a saludar por su nombre y arrancan enseguida.<br>
      La primera sesión dura entre 10 y 20 minutos.</p>
      <p style="margin:0;">Cualquier pregunta, respondé este mail.</p>
    </div>
    <div style="background:#f9f9f9;padding:14px 24px;text-align:center;font-size:0.75rem;color:#999;">
      Toto el Tutor — Registro Beta
    </div>
  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'Toto el Tutor <toto@totoeltutor.com.ar>',
        to: [emailPadre],
        subject: `${escapeHtml(nombreAlumno)} ya puede empezar a usar Toto`,
        html: htmlBody,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(500).json({ error: 'Error enviando email' });
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error('Register handler error:', err);
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
