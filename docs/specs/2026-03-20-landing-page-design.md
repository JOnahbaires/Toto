# Toto el Tutor — Landing Page Design Spec

## Fecha: 2026-03-20

---

## Objetivo

Landing page separada para captar padres (B2C) y dirigirlos a probar la app. Vive en su propio dominio/proyecto Vercel. La app sigue en `toto-rust.vercel.app`.

## Audiencia

**Cliente = padre/madre.** La landing les habla a ellos, no al hijo. Comunicación centrada en el dolor relacional (tarea = pelea) y el outcome (autonomía del hijo + mejor vínculo familiar).

## Estilo visual

Híbrido: estética confiable para padres (fondo claro, blanco/gris suave) con toques del mundo visual de Toto (accent purple #7c6fff, pink #ff6b8a, green #3de8a0). Fuentes Nunito + Baloo 2 para continuidad con la app.

---

## Estructura de secciones

### 1. Hero

- Logo Toto + cara de Toto a un costado
- **Headline:** "Que la tarea los una, no los separe."
- **Sub:** "Toto es el compañero de tarea de tu hijo: lo guía con preguntas para que aprenda a pensar solo, sin que vos tengas que ser el profe."
- **CTA primario:** "Probar ahora gratis" → `toto-rust.vercel.app`
- **CTA secundario:** "Hablanos por WhatsApp" → link WhatsApp con mensaje predefinido

### 2. El dolor (3 bloques)

Tres tarjetas o bloques visuales que describen las capas del problema:

1. **Padre detonado** — "Llegás detonado. La tarea no tiene por qué ser otro problema."
2. **Sin método** — "No sabés cómo explicarle. YouTube no alcanza. ChatGPT le hace la tarea."
3. **Tarea = pelea** — "La tarea se vuelve pelea. El vínculo se desgasta."

### 3. Lo que Toto transforma (contraste)

Tres outcomes en bloques visuales con íconos/ilustraciones:

- **Para tu hijo:** "Aprende a pensar, no a copiar. Gana autonomía real."
- **Para vos:** "Soltás sin culpa. La tarea deja de ser pelea."
- **Para la familia:** "Menos gritos, más vínculo."

### 4. Cómo funciona (3 pasos)

Pasos visuales numerados:

1. Tu hijo sube la tarea o elige un tema
2. Toto lo guía con preguntas — nunca le da la respuesta
3. Vos recibís un resumen de cómo le fue

### 5. Por qué no ChatGPT

Tabla comparativa simple:

| | ChatGPT | Toto |
|---|---|---|
| Respuesta | Se la da hecha | Lo guía a encontrarla |
| Tu hijo | Copia y pega | Piensa y aprende |
| Resultado | Deuda cognitiva | Autonomía real |

Línea aspiracional debajo: *"Tu hijo doma la IA, no al revés."*

### 6. Trust builders

Bullets o tarjetas con íconos:

- "Habla como un pibe argentino, no como un robot"
- "Después de 3 pistas, te invita a conectar juntos" (Parent Checkpoint)
- "Gana estrellas por cada intento, no por respuestas correctas"

### 7. Captación

- **WhatsApp CTA grande** — botón verde, abre chat con mensaje predefinido
- **Email** — campo simple + botón "Manteneme al tanto"

### 8. Footer

- "Hecho en Buenos Aires"
- Links mínimos (política privacidad si aplica)

---

## Stack técnico

- **HTML estático** — un solo archivo, sin framework (consistente con el proyecto actual)
- **CSS inline o en `<style>`** — sin dependencias externas salvo Google Fonts
- **Deploy:** Proyecto separado en Vercel
- **WhatsApp:** Link directo `https://wa.me/PENDIENTE_NUMERO?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20Toto%20el%20Tutor` — número pendiente (línea biz por comprar). Dejar placeholder visible en el código para reemplazar fácil.
- **Email captación:** Endpoint `/api/subscribe` usando Resend API. Comportamiento: guarda en Google Sheets (via Sheets API o append) + envía notificación a `toto@ogq.io`. Sin base de datos.
- **Responsive:** Mobile-first (padres llegan desde celular vía WhatsApp/redes)
- **Assets:** Logo Toto (`Toto Logo.png`) + cara de Toto (`cara-toto.png`) — embedidos como base64 (consistente con el approach de index.html de la app principal)
- **Breakpoint:** 768px. Por debajo, todo colapsa a 1 columna. La tabla comparativa (sección 5) se convierte en tarjetas apiladas en mobile.
- **Privacidad:** Incluir link a página de política de privacidad mínima (requerido por captación de emails bajo Ley 25.326)

## Fuentes

- **Nunito** (400, 600, 700, 800) — cuerpo
- **Baloo 2** (600, 700) — headlines

## Paleta (landing)

| Token | Valor | Uso |
|---|---|---|
| bg | #fafafa | Fondo principal |
| surface | #ffffff | Tarjetas |
| text | #1a1a2e | Texto principal |
| text-mid | #4a4a6a | Texto secundario |
| accent | #7c6fff | CTAs, links, acentos |
| pink | #ff6b8a | Dolor / alertas |
| green | #3de8a0 | Outcomes positivos |
| whatsapp | #25D366 | WhatsApp CTA (brand green) |

---

## Vocabulario externo (reglas de copy)

Tomado de `TOTO-COPY-FRAMING-NARRATIVA.md`:

| Concepto interno | Cómo se dice en la landing |
|---|---|
| Método socrático | "Lo guía con preguntas, nunca le da la respuesta" |
| Deuda cognitiva | "La IA piensa por él en vez de enseñarle a pensar" |
| AIJ (AI Jockey) | "Tu hijo doma la IA, no al revés" |
| Parent Checkpoint Mode | "Un momento para conectar juntos" |
| Gamificación | "Gana estrellas por cada intento" |
| Claude Haiku / Anthropic | No se menciona |

---

## Fuera de alcance (v1)

- Testimonios (todavía no hay suficientes)
- Video demo
- Pricing
- Blog / contenido
- SEO avanzado
- Analytics (se puede agregar después)
- Sección para el hijo (la landing habla al padre)

---

## Archivos de referencia

- `TOTO-CONTEXTO-COMPETITIVO-CODE.md` — posicionamiento competitivo
- `TOTO-COPY-FRAMING-NARRATIVA.md` — frases, dolor, vocabulario
- `Toto Logo/` — assets visuales
