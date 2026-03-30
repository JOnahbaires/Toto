// api/get-registros.js — Lee registros del Google Sheet de beta + cruza activación con docs/analyses/
// Auth: ORCHESTRATOR_PIN

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1wAnkil_XHZqzJrQlH978kD6aDMBwioze1n8EMqUzwxQ/gviz/tq?tqx=out:csv';

const REPO = 'JOnahbaires/Toto';

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

  const { pin } = req.body;
  const correctPin = process.env.ORCHESTRATOR_PIN;
  if (!correctPin || pin !== correctPin) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // 1. Leer Google Sheet
    const csvRes = await fetch(SHEET_CSV_URL);
    if (!csvRes.ok) throw new Error('Error leyendo Google Sheet');
    const csvText = await csvRes.text();
    const registros = parseCSV(csvText);

    // 2. Leer lista de analyses para cruzar activación
    const analyses = await fetchAnalysesList();

    // 3. Cruzar: para cada registro, buscar si hay sesión con nombre similar
    const enriched = registros.map(r => {
      const nombreHijo = normalize(r.nombreHijo);
      const activated = analyses.some(a => normalize(a).includes(nombreHijo) && nombreHijo.length > 2);
      return { ...r, activated };
    });

    // 4. Métricas
    const reales = enriched.filter(r => !isTest(r));
    const activados = reales.filter(r => r.activated);
    const hoy = new Date().toISOString().slice(0, 10);
    const registrosHoy = reales.filter(r => r.fecha.startsWith(hoy));

    return res.status(200).json({
      ok: true,
      registros: enriched,
      metrics: {
        total: enriched.length,
        reales: reales.length,
        activados: activados.length,
        tasaActivacion: reales.length > 0 ? Math.round((activados.length / reales.length) * 100) : 0,
        registrosHoy: registrosHoy.length
      }
    });
  } catch (err) {
    console.error('get-registros error:', err);
    return res.status(500).json({ error: err.message || 'Error interno' });
  }
}

/** Detecta registros de test (edad 99, "test" en nombre) */
function isTest(r) {
  const n = (r.nombrePadre + ' ' + r.nombreHijo).toLowerCase();
  return r.edad >= 90 || n.includes('test');
}

/** Normaliza nombre para comparación fuzzy */
function normalize(s) {
  return s.toLowerCase().replace(/[^a-záéíóúñü0-9]/g, '').trim();
}

/** Parsea CSV con comillas (output de Google Sheets) */
function parseCSV(csv) {
  const lines = csv.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 6) continue;
    rows.push({
      fecha: cols[0] || '',
      nombrePadre: cols[1] || '',
      email: cols[2] || '',
      nombreHijo: cols[3] || '',
      edad: parseInt(cols[4]) || 0,
      grado: cols[5] || '',
      whatsapp: cols[6] || ''
    });
  }
  return rows;
}

/** Parsea una línea CSV respetando comillas */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/** Obtiene lista de nombres de archivos en docs/analyses/ via GitHub API */
async function fetchAnalysesList() {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) return [];

  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/contents/docs/analyses`,
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json'
        }
      }
    );
    if (!res.ok) return [];
    const files = await res.json();
    return files
      .filter(f => f.name.endsWith('.md'))
      .map(f => f.name.replace('.md', ''));
  } catch (_) {
    return [];
  }
}
