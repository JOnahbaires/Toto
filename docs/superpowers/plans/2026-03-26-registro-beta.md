# Sistema de Registro Beta 2 — Plan de Implementación

> **Para agentes:** REQUIRED SUB-SKILL: usar superpowers:executing-plans para implementar tarea por tarea.

**Goal:** Que los padres se registren via Google Form y reciban un link que identifica a su hijo automáticamente en Toto.

**Architecture:** `api/register.js` genera un token base64 con datos del alumno y envía el email via Resend. `app.html` lee el token al cargar y pre-llena localStorage. Sin base de datos.

**Tech Stack:** Node.js (Vercel Functions), Resend (ya configurado con `RESEND_API_KEY`), base64 nativo del runtime Node.js, Google Apps Script

---

### Tarea 1: Crear `api/register.js`

**Archivos:**
- Crear: `api/register.js`

- [ ] Crear el archivo con este contenido:

```js
import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { nombrePadre, emailPadre, nombreAlumno, edad, grado, whatsapp } = req.body;

  if (!nombrePadre || !emailPadre || !nombreAlumno || !edad || !grado) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const idBeta = nombreAlumno.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  const tokenData = { nombre: nombreAlumno, grado, edad: Number(edad), idBeta, tester: false };
  const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
  const link = `https://app.totoeltutor.com.ar?token=${token}`;

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: 'Toto el Tutor <toto@totoeltutor.com.ar>',
      to: emailPadre,
      subject: `${nombreAlumno} ya puede empezar a usar Toto`,
      html: `
        <p>Hola ${nombrePadre},</p>
        <p>${nombreAlumno} ya está listo para su primera sesión con Toto.<br>
        Mandále este link desde tu celular o computadora:</p>
        <p><a href="${link}" style="font-size:18px;font-weight:bold;">${link}</a></p>
        <p>Toto lo va a saludar por su nombre y arrancan enseguida.<br>
        La primera sesión dura entre 10 y 20 minutos.</p>
        <p>Cualquier pregunta, respondé este mail.</p>
        <p>— El equipo de Toto</p>
      `
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error enviando email' });
  }

  return res.status(200).json({ ok: true });
}
```

- [ ] Commit:
```bash
git add api/register.js
git commit -m "feat: api/register.js — genera token base64 y envía email al padre"
git push origin main
```

- [ ] Verificar que el endpoint responde 400 con campos faltantes:
```bash
curl -X POST https://totoeltutor.com.ar/api/register \
  -H "Content-Type: application/json" \
  -d '{"nombrePadre":"Test"}'
# Esperado: {"error":"Faltan campos requeridos"}
```

- [ ] Verificar flujo completo con tu propio email:
```bash
curl -X POST https://totoeltutor.com.ar/api/register \
  -H "Content-Type: application/json" \
  -d '{"nombrePadre":"Diego","emailPadre":"TU_EMAIL_REAL","nombreAlumno":"Lucas","edad":11,"grado":"6to","whatsapp":null}'
# Esperado: {"ok":true} + email en tu casilla con link
```

- [ ] Abrir el link del email recibido y verificar que la URL tiene `?token=` con un string largo en base64.

---

### Tarea 2: Leer token en `app.html`

**Archivos:**
- Modificar: `app.html`

- [ ] Buscar en `app.html` la línea:
```js
const savedName = localStorage.getItem('toto_nombre');
```
Está aproximadamente en la línea 1998. Agregar el siguiente bloque INMEDIATAMENTE ANTES de esa línea:

```js
// ── Token de registro beta ──────────────────────────────────
(function() {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      const alumno = JSON.parse(atob(token));
      if (alumno.nombre) localStorage.setItem('toto_nombre', alumno.nombre);
      if (alumno.edad)   localStorage.setItem('toto_edad', String(alumno.edad));
      if (alumno.grado)  localStorage.setItem('toto_grado', alumno.grado);
      window.history.replaceState({}, '', window.location.pathname);
    }
  } catch(e) { /* token inválido → onboarding normal */ }
})();
// ────────────────────────────────────────────────────────────
```

- [ ] Commit:
```bash
git add app.html
git commit -m "feat: leer token de URL y pre-cargar datos del alumno en localStorage"
git push origin main
```

- [ ] Verificar en el navegador. Generar un token de prueba en la consola del browser:
```js
btoa(JSON.stringify({nombre:"Lucas",grado:"6to",edad:11,idBeta:"lucas-test",tester:false}))
// Copia el string resultante
```
Abrir: `totoeltutor.com.ar/app?token=<STRING_COPIADO>`

Verificar en DevTools → Application → Local Storage → `totoeltutor.com.ar`:
- `toto_nombre` = `Lucas`
- `toto_edad` = `11`
- `toto_grado` = `6to`

Verificar también que la URL quedó limpia (sin `?token=...`).

- [ ] Verificar que con token corrupto (`totoeltutor.com.ar/app?token=basura`) la app carga normalmente sin errores.

---

### Tarea 3: Actualizar botón en landing

**Archivos:**
- Modificar: `index.html`

*(Esta tarea se hace cuando Jonathan tenga la URL del Google Form)*

- [ ] Buscar en `index.html` el botón con texto "Probalo gratis". Reemplazar su atributo `href="#"` por:
```html
href="https://docs.google.com/forms/d/e/XXXXXXXXXXXXXXXX/viewform" target="_blank" rel="noopener"
```
*(reemplazar XXXXXXX con la URL real del form)*

- [ ] Commit:
```bash
git add index.html
git commit -m "feat: botón Probalo gratis apunta al Google Form de registro"
git push origin main
```

- [ ] Verificar en `totoeltutor.com.ar` que el botón abre el form en nueva pestaña.

---

### Tarea 4: Configurar subdominio `app.totoeltutor.com.ar` (manual — Jonathan)

*(Requiere acceso a Vercel Dashboard y al panel de DNS del dominio)*

- [ ] Ir a Vercel Dashboard → proyecto Toto → Settings → Domains
- [ ] Click "Add" → ingresar `app.totoeltutor.com.ar`
- [ ] Vercel va a mostrar un registro CNAME para agregar al DNS (ej: `cname.vercel-dns.com`)
- [ ] Agregar ese registro en el proveedor del dominio (donde compraste `totoeltutor.com.ar`)
- [ ] Esperar propagación (~5 minutos)
- [ ] Verificar que `app.totoeltutor.com.ar` sirve la app de Toto

---

### Tarea 5: Crear Google Form + Apps Script (manual — Jonathan)

*(Requiere cuenta de Google)*

- [ ] Crear Google Form con estos campos, en este orden y con estos nombres exactos:
  1. **"Nombre y apellido del padre/madre"** — texto corto, requerido
  2. **"Email"** — texto corto con validación email, requerido
  3. **"Nombre del hijo/a"** — texto corto, requerido
  4. **"Edad"** — número, requerido
  5. **"Grado"** — lista desplegable: 1ro / 2do / 3ro / 4to / 5to / 6to / 7mo, requerido
  6. **"WhatsApp (opcional)"** — texto corto, no requerido

  *(Los nombres de los campos deben coincidir EXACTAMENTE con los del script — mayúsculas, tildes, etc.)*

- [ ] En el Form → menú ⋮ (tres puntos arriba a la derecha) → "Editor de secuencias de comandos"

- [ ] Reemplazar todo el contenido con:

```js
function onFormSubmit(e) {
  var r = e.namedValues;
  var payload = {
    nombrePadre:  r['Nombre y apellido del padre/madre'][0],
    emailPadre:   r['Email'][0],
    nombreAlumno: r['Nombre del hijo/a'][0],
    edad:         parseInt(r['Edad'][0]),
    grado:        r['Grado'][0],
    whatsapp:     (r['WhatsApp (opcional)'] || [''])[0] || null,
    emailAlumno:  (r['Email del hijo/a (opcional)'] || [''])[0] || null
  };
  UrlFetchApp.fetch('https://totoeltutor.com.ar/api/register', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}
```

- [ ] Guardar el script (Ctrl+S)
- [ ] Ir a Triggers (ícono reloj en la barra lateral) → "Add Trigger"
  - Función: `onFormSubmit`
  - Deployment: `Head`
  - Event source: `From spreadsheet` → NO, elegir **"From form"**
  - Event type: **"On form submit"**
- [ ] Guardar → autorizar permisos cuando Google lo pida

---

### Test end-to-end final

- [ ] Ir a `totoeltutor.com.ar` → clic "Probalo gratis" → se abre el Google Form en nueva pestaña
- [ ] Completar el form con datos reales (tu propio email de padre)
- [ ] Revisar casilla — debe llegar el email en menos de 30 segundos
- [ ] Copiar el link del email → abrirlo en una ventana de incógnito (para tener localStorage limpio)
- [ ] Verificar en DevTools → Application → Local Storage que `toto_nombre` tiene el nombre del alumno
- [ ] Verificar que Toto saluda al alumno por su nombre en el onboarding
- [ ] Cerrar y volver a abrir `app.totoeltutor.com.ar` → Toto recuerda el nombre (persistido en localStorage)
