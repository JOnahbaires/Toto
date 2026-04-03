import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

  const { alumno_nombre, grado, materia, tarea, parent_email, fecha, colegio } = req.body;
  if (!parent_email || !alumno_nombre || !tarea) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const materiaLabel = {
    matematica: 'Matemática',
    lengua: 'Lengua',
    ingles: 'Inglés',
    naturales: 'Ciencias Naturales',
    sociales: 'Ciencias Sociales',
    judaicos: 'Estudios Judaicos',
    otra: 'Otra materia'
  }[materia] || materia || 'la materia';

  // ── BANCO PREGENERADO (NotebookLM) ──────────────────────────────────────────
  // Si existe un banco para este colegio/grado/materia, lo usa sin costo de API.
  // Formato del archivo: docs/curricula/{colegio}/{grado}-{materia}.json
  // Fallback: genera con Haiku si no hay banco disponible.

  let flashcards = tryLoadFromBank({ colegio, grado, materia, tarea });

  if (!flashcards) {
    // ── GENERACIÓN CON HAIKU (fallback) ─────────────────────────────────────
    const curriculaContext = getCurriculaContext({ colegio, grado, materia });

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
El alumno se llama ${alumno_nombre}, está en ${grado}° grado, y trabajó hoy en: "${tarea}" (materia: ${materiaLabel}).${curriculaContext}

Generá exactamente 5 flashcards de repaso para que el padre las use con el hijo.
Basate ESPECÍFICAMENTE en el tema "${tarea}" y en el contexto curricular indicado arriba.

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
  }

  if (!Array.isArray(flashcards) || flashcards.length === 0) {
    return res.status(500).json({ error: 'Flashcards inválidas' });
  }

  // Armar email HTML
  const colegioLabel = colegio === 'scholem' ? 'Scholem Aleijem' : null;
  const cardsHtml = flashcards.map((c, i) => `
    <div style="background:#f9f8ff;border-left:4px solid #7c6fff;border-radius:8px;padding:16px 20px;margin-bottom:12px;">
      <div style="font-size:0.8rem;color:#7c6fff;font-weight:bold;margin-bottom:6px;">TARJETA ${i + 1}</div>
      <div style="font-size:1rem;font-weight:bold;color:#222;margin-bottom:8px;">❓ ${escapeHtml(c.pregunta)}</div>
      <div style="font-size:0.95rem;color:#444;">✅ ${escapeHtml(c.respuesta)}</div>
    </div>
  `).join('');

  const curriculaFooter = colegioLabel
    ? `<p style="margin:4px 0 0;font-size:0.8rem;color:#aaa;">Material alineado al programa de ${escapeHtml(grado)}° grado de ${colegioLabel}, ${escapeHtml(materiaLabel)}, 1er bimestre 2026.</p>`
    : `<p style="margin:4px 0 0;font-size:0.8rem;color:#aaa;">Material alineado al Diseño Curricular CABA 2026 para ${escapeHtml(grado)}° grado de ${escapeHtml(materiaLabel)}.</p>`;

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
        <em>"${escapeHtml(tarea)}"</em> (${escapeHtml(materiaLabel)}, ${escapeHtml(String(grado))}° grado).
      </p>
      <p style="margin:0 0 16px;color:#444;">Acá van 5 tarjetas para repasar juntos cuando tengan un momento:</p>
      ${cardsHtml}
      <div style="margin:20px 0 0;border-top:1px solid #eee;padding-top:16px;">
        ${curriculaFooter}
      </div>
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

// ── Carga banco pregenerado y filtra por relevancia al tema ─────────────────
function tryLoadFromBank({ colegio, grado, materia, tarea }) {
  if (!colegio || !materia) return null;

  const gradeNum = String(grado).replace(/[^0-9]/g, '');
  const bankPath = join(__dirname, '..', 'docs', 'curricula', colegio, `${gradeNum}-${materia}.json`);

  let banco;
  try {
    banco = JSON.parse(readFileSync(bankPath, 'utf-8'));
  } catch {
    return null; // Banco no existe todavía — fallback a Haiku
  }

  if (!Array.isArray(banco) || banco.length === 0) return null;

  // Filtrar cards relevantes al tema de la sesión (matching por palabras clave)
  const tareaLower = tarea.toLowerCase();
  const keywords = tareaLower.split(/\s+/).filter(w => w.length > 3);

  const scored = banco.map(card => {
    const text = `${card.tema || ''} ${card.pregunta || ''}`.toLowerCase();
    const score = keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
    return { card, score };
  });

  // Ordenar por relevancia, tomar top 5 (si no hay suficientes relevantes, completar con random)
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5).map(s => s.card);

  // Mapear al formato esperado { pregunta, respuesta }
  return top.map(c => ({ pregunta: c.pregunta, respuesta: c.respuesta }));
}

// ── Currícula textual como fallback para el prompt de Haiku ─────────────────
function getCurriculaContext({ colegio, grado, materia }) {
  const CURRICULA = {
    'scholem_6': {
      matematica: 'Números naturales sin restricción de cifras, ordenamiento en recta numérica. Cálculos estimativos de multiplicación y división. Relación c=d·q+r con r<d. Jerarquía de operaciones en operaciones combinadas. Problemas de varios pasos (caps. 1-3 y 5 del libro El libro de mate 6).',
      lengua: 'Los mitos: origen y características. Lectura de "El mar y la serpiente" de Paula Bombara. Sustantivos y adjetivos: género y número. Construcción sustantiva (N, MD, MI). Respuesta de carpeta: estructura, conectores, vocabulario.',
      naturales: 'Modelo de partículas. Estados de la materia y cambios de estado. Calor y temperatura: definiciones y diferencias. Uso de termómetros. Equilibrio térmico. (cap. 5 del libro Insignia Ciencias Naturales)',
      ingles: 'Vocabulario Wild West (barrel, handcuffs) — Super Minds Unit 5. Materials and containers (cardboard, glass, leather) — Own it 3 Unit 6. Gramática: made of / used for; Present Simple Passive; Past Simple Passive. Writing: a review.',
      judaicos: 'Meguilá de Esther y la película "Una noche con el rey". Nacimiento de Moshé y su historia. Pesaj y el Seder. Época romana en Judea, destrucción del Segundo Templo y el exilio. Proyecto Mi Historia Familiar (museo Anu).'
    }
  };

  const gradeNum = String(grado).replace(/[^0-9]/g, '');
  const key = colegio ? `${colegio}_${gradeNum}` : null;
  const ctx = key && CURRICULA[key]?.[materia];

  return ctx
    ? `\n\nCONTEXTO CURRICULAR REAL (Scholem Aleijem, ${grado}° grado, 1er bimestre 2026):\n${ctx}`
    : `\n\nUsá el currículo CABA 2026 para ${grado}° grado de ${materia}.`;
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
