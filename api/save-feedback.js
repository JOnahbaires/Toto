// api/save-feedback.js — Guarda feedback procesado en docs/feedback/ del repo GitHub
// Auth: misma ORCHESTRATOR_PIN del proxy de agentes
// Crea archivo individual + actualiza INDEX.md

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

  const { pin, alumno, padre, canales, feedbackCrudo, intakeOut, analystOut, metricsOut, parsed } = req.body;

  // Auth
  const correctPin = process.env.ORCHESTRATOR_PIN;
  if (!correctPin || pin !== correctPin) return res.status(401).json({ error: 'Unauthorized' });

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) return res.status(500).json({ error: 'GITHUB_TOKEN no configurado' });

  if (!alumno || !padre || !intakeOut || !analystOut || !metricsOut) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const dateDisplay = now.toLocaleDateString('es-AR');

  const safeAlumno = alumno.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]/g, '_').substring(0, 20);
  const safePadre = padre.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]/g, '_').substring(0, 20);
  const fileName = `docs/feedback/${dateStr}_${safeAlumno}_${safePadre}.md`;

  const categoria = (parsed?.categoria || '—').replace(/[\t\n]/g, ' ');
  const prioridad = (parsed?.prioridad || '—').replace(/[\t\n]/g, ' ');
  const accionSugerida = (parsed?.accion_sugerida || '—').replace(/[\t\n]/g, ' ');
  const faseRoadmap = (parsed?.fase_roadmap || '—').replace(/[\t\n]/g, ' ');

  // ── Contenido del archivo individual ─────────────────────────────────────
  const fileContent = [
    '---',
    `fecha: ${dateStr}`,
    `alumno: ${alumno}`,
    `fuente: ${padre}`,
    `canales: ${canales || '—'}`,
    'status: pending_discussion',
    `categoria: ${categoria}`,
    `prioridad: ${prioridad}`,
    `fase_roadmap: ${faseRoadmap}`,
    '---',
    '',
    '## Feedback crudo',
    '',
    feedbackCrudo || '—',
    '',
    '## Ficha (Intake Agent)',
    '',
    intakeOut,
    '',
    '## Análisis (Analyst Agent)',
    '',
    analystOut,
    '',
    '## Métricas (Metrics Agent)',
    '',
    metricsOut,
    '',
    '## Discusión con Jonah',
    '',
    '_Pendiente_',
    '',
    '## Implementación',
    '',
    '_Pendiente_',
    '',
  ].join('\n');

  const REPO = 'JOnahbaires/Toto';
  const GH_HEADERS = {
    'Authorization': `Bearer ${githubToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github+json',
  };

  // ── Guardar archivo individual ────────────────────────────────────────────
  const fileRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${fileName}`,
    {
      method: 'PUT',
      headers: GH_HEADERS,
      body: JSON.stringify({
        message: `feedback: ${alumno} — ${padre} (${dateStr})`,
        content: Buffer.from(fileContent).toString('base64'),
      }),
    }
  );

  if (!fileRes.ok) {
    const err = await fileRes.json().catch(() => ({}));
    return res.status(500).json({ error: `GitHub error al guardar archivo: ${err.message || fileRes.status}` });
  }

  // ── Actualizar INDEX.md ───────────────────────────────────────────────────
  const indexPath = 'docs/feedback/INDEX.md';
  const INDEX_HEADER = [
    '# Índice de Feedback — Toto el Tutor',
    '',
    '> Generado automáticamente. Status: `pending_discussion` → `discussed` → `applied`',
    '',
    '| Fecha | Alumno | Fuente | Categoría | Prioridad | Status | Acción sugerida | Archivo |',
    '|-------|--------|--------|-----------|-----------|--------|-----------------|---------|\n',
  ].join('\n');

  let indexSha = null;
  let indexContent = INDEX_HEADER;

  try {
    const getRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${indexPath}`,
      { headers: GH_HEADERS }
    );
    if (getRes.ok) {
      const data = await getRes.json();
      indexSha = data.sha;
      indexContent = Buffer.from(data.content, 'base64').toString('utf8');
    }
  } catch (_) { /* INDEX.md no existe aún — se crea desde cero */ }

  const accionCorta = accionSugerida.length > 55 ? accionSugerida.slice(0, 55) + '…' : accionSugerida;
  const newRow = `| ${dateDisplay} | ${alumno} | ${padre} | ${categoria} | ${prioridad} | pending_discussion | ${accionCorta} | [ver](${dateStr}_${safeAlumno}_${safePadre}.md) |\n`;
  const updatedIndex = indexContent.trimEnd() + '\n' + newRow;

  const indexBody = {
    message: `feedback index: ${alumno} — ${padre} (${dateStr})`,
    content: Buffer.from(updatedIndex).toString('base64'),
  };
  if (indexSha) indexBody.sha = indexSha;

  const indexRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${indexPath}`,
    { method: 'PUT', headers: GH_HEADERS, body: JSON.stringify(indexBody) }
  );

  return res.status(200).json({
    ok: true,
    file: fileName,
    index_updated: indexRes.ok,
  });
}
