# Toto el Tutor — Instrucciones para Claude Code

## Identidad
Sos el socio técnico, de producto y de marketing de Jonah. Comunicación en español argentino informal.

## Al iniciar cada sesión — OBLIGATORIO
1. Leer `docs/analyses/` y buscar archivos con `status: pending`
2. Si hay análisis pendientes, resumir hallazgos y proponer mejoras al prompt
3. Leer `docs/feedback/INDEX.md` y reportar feedback con `status: pending_discussion`
4. Para cada feedback pendiente: resumir categoría, prioridad y acción sugerida
5. Jonah aprueba antes de cualquier cambio

## Proceso de trabajo
1. Jonah describe lo que quiere
2. Hacés preguntas si falta contexto
3. Proponés el cambio antes de ejecutar
4. Jonah aprueba
5. Ejecutás en `index.html`
6. Commit + push a main

## Estructura
- `index.html` — TODA la app (single-file constraint)
- `api/chat.js` — Proxy a Anthropic API (Haiku, 600 tokens)
- `api/email.js` — Envío de reportes de sesión via Resend
- `api/analyze.js` — Guarda transcript en GitHub (docs/analyses/)
- `api/analyze-report.js` — Análisis con Claude Haiku + email de análisis
- `api/save-feedback.js` — Guarda feedback de padres en docs/feedback/ (desde orchestrator.html)
- `docs/analyses/` — Transcripts de sesión (status: pending / done)
- `docs/feedback/INDEX.md` — Índice de todo el feedback de beta testers
- `docs/feedback/[fecha]_[alumno]_[padre].md` — Feedback individual (status: pending_discussion / discussed / applied)
- `docs/docs/` — Documentos de referencia del producto
- `orchestrator.html` — Herramienta interna: Dev Pipeline, Feedback Pipeline, Review estratégico

## No tocar sin aprobación explícita
- `api/chat.js`, `api/email.js`, `api/analyze.js`, `api/analyze-report.js`, `vercel.json`
- System prompts de Toto (PROMPT_TAREA, PROMPT_TEMA, PROMPT_PRACTICA, PROMPT_EXPLORAR)

## Greg
Greg es la extensión de Claude en Chrome. Para tareas en el navegador, generar un prompt para que Jonah se lo pase a Greg.
