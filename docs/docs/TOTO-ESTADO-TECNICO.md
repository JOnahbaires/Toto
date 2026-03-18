# 🛠️ TOTO EL TUTOR — ESTADO TÉCNICO (Marzo 2026)
> Referencia del estado actual del código. Actualizar después de cada bloque de trabajo.

---

## 📁 ESTRUCTURA DEL REPO

```
github.com/JOnahbaires/Toto
├── index.html          ← TODA la app (frontend + lógica + estilos + logo base64)
├── api/
│   └── chat.js         ← Proxy serverless hacia Anthropic API
├── vercel.json         ← Config de routing para Vercel
└── docs/               ← Documentos de referencia (este archivo vive acá)
```

**Deploy**: Vercel → https://toto-rust.vercel.app  
**Rama principal**: `main`

---

## 🔧 api/chat.js — Lo que hace

```javascript
// Recibe llamadas de index.html y las proxea a Anthropic
// max_tokens: 600
// Retry logic: 2 reintentos con delays de 3s y 6s
// Modelo: claude-haiku-4-5-20251001
```

---

## 🧩 ARQUITECTURA DE index.html

### Flujo general de la app

```
1. WARMUP SCREEN
   → Usuario ingresa nombre (guardado en localStorage)
   → Elige estado emocional: bien / más o menos / mal
   → Elige modo: "Resolver tarea" o "Explicame un tema"

2. CHAT SCREEN
   a) Modo "Resolver tarea":
      - Attempt gate: el alumno debe escribir su intento primero
      - Toto detecta la materia via keyword regex (no hay selector manual)
      - Primera pregunta del pool rotativo (por materia + mood)
      - Hint strip (máximo 3 pistas visuales)
      - Si se usan 3 hints → Parent Checkpoint Mode
      - XP/estrellas por cada respuesta sustancial

   b) Modo "Explicame un tema":
      - Toto enseña via analogías y preguntas
      - Sin attempt gate

3. SESSION END
   - Trigger A: botón "Nueva tarea"
   - Trigger B: Toto envía señal [SESSION_END] conversacionalmente (strippada antes de mostrar)
   - Trigger C: inactividad 15 minutos
   - Acción: EmailJS envía reporte a jonah.baires@gmail.com
   - Flag _emailSent previene duplicados
```

### Sistema de email (EmailJS)
```javascript
Service ID:  service_kudmo6n
Template ID: template_ji0mjoo
Public Key:  KG28xVpC7Fq4vVJfa
Destino:     jonah.baires@gmail.com
Payload:     métricas completas de sesión (nombre, materia, XP, hints usados, timestamp)
```

### Sistema de fotos
```javascript
// Al subir una foto:
// 1. Primera llamada API: incluye base64 completo
// 2. Respuesta recibida: API guarda SOLO el resumen textual (e.g. "Foto de problema de matemática: ...")
// 3. Llamadas subsiguientes: usan solo el resumen textual
// Razón: evitar errores de overload por reenviar base64 en cada turno
```

### Persistencia (localStorage)
```javascript
// Qué se guarda:
localStorage.getItem('totoNombre')    // nombre del estudiante
// El resto de la sesión es in-memory (se pierde al recargar)
```

---

## 🐛 BUGS CONOCIDOS

| Bug | Severidad | Estado |
|-----|-----------|--------|
| Descarga de sesión tiene encoding incorrecto con caracteres acentuados | Media | Propuesta pendiente de aprobación |

---

## 🔐 VARIABLES DE ENTORNO (Vercel)

```
ANTHROPIC_API_KEY=<guardada en Vercel, NO en el repo>
```

---

## 📝 CÓMO LEER EL REPO DESDE CLAUDE

```python
# Método confiable (NO usar raw.githubusercontent ni GitHub API directamente)
# 1. Fetch: https://github.com/JOnahbaires/Toto/blob/main/index.html
# 2. Parsear el script tag: application/json con data-target="react-app.embeddedData"
# 3. Extraer array rawLines (bracket-depth counting maneja JSON anidado)
# 4. Unir con newlines → código completo
```

---

## ✅ CÓMO HACER CAMBIOS SEGUROS EN index.html

```python
# USAR: Python str.replace() inline (más confiable que sed para bloques multilínea)
# EVITAR: sed -i con bloques de varias líneas
# SIEMPRE: Proponer el cambio específico antes de ejecutar
# SIEMPRE: Confirmar que el bloque a reemplazar existe exactamente como se escribe
```

---

## 🔄 PROCESO DE DEPLOY

```
1. Claude genera el código/cambio en sesión
2. Jonah revisa (screenshot + revisión visual)
3. Jonah aprueba → hace copy-paste a su editor local
4. Jonah pushea a github.com/JOnahbaires/Toto (main)
5. Vercel detecta el push → deploy automático
6. Verificar en toto-rust.vercel.app
```

---

## 📦 HISTORIAL DE DECISIONES TÉCNICAS

| Decisión | Razonamiento | Fecha |
|----------|-------------|-------|
| Single-file (todo en index.html) | Sin build pipeline, más simple para Jonah sin background técnico | Inception |
| localStorage en vez de DB | MVP rápido, sin backend, sin auth | Inception |
| Detección de materia por regex (no selector manual) | UX más fluida para el niño | Iteración 1 |
| Pool rotativo de primeras preguntas | Feedback de Ofek: la primera pregunta era siempre igual | Iteración 2 |
| Base64 → resumen textual después de 1er mensaje | Fix de errores de overload en API | Iteración 3 |
| EmailJS para reportes | Sin backend propio, fácil de implementar | Iteración 3 |
| Señal [SESSION_END] conversacional | Triggers por click son poco confiables en mobile | Iteración 3 |
| claude-haiku (no sonnet) en producción | Costo por token: haiku es ~15x más barato | Iteración 1 |

