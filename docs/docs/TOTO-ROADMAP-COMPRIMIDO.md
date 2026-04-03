# 🚀 TOTO EL TUTOR (TotalTutor) — ROADMAP PRIORIZADO (Abril 2026)
> Versión comprimida. Actualizado: 2 abril 2026.
> Integra insights de "Mitos EdTech" (Raffaghelli et al., 2024) — pedagogía digital crítica.

---

## 📍 ESTADO HOY

- ✅ MVP deployado en toto-rust.vercel.app
- ✅ Branding definido: **TotalTutor** — dominio totaltutor.com.ar comprado + auditio+.com.ar conectado
- ✅ Testing con ~5 niños (incluye Ofek, Nico, Emma)
- ✅ Todos los features core del MVP implementados (ver TOTO-ESTADO-TECNICO.md)
- ✅ Sistema de email migrado a Resend (`api/email.js`)
- ✅ Análisis post-sesión automático con Claude Sonnet (`api/analyze.js` + `api/analyze-report.js`)
- ✅ Warmup captura edad y grado (1er a 7mo)
- 🔄 Validando core loop antes de agregar complejidad

---

## 🗓️ FASES

### FASE 1 — Validación MVP (Marzo — Abril 2026)
**Meta:** 5 niños, feedback real, 70 familias pagando

| Feature | Prioridad | Estado |
|---------|-----------|--------|
| Fix encoding descarga sesión | 🔴 Alta | Pendiente |
| Pruebas de práctica (Practice Test Mode) | 🟡 Media | ✅ Done — PROMPT_PRACTICA + checkpoints cada 5 preguntas |
| Inglés como materia | 🟡 Media | ✅ Done — detección por regex, pool de preguntas, responde en inglés |
| Modo exploración sin tarea específica (Explore Mode) | 🟡 Media | Pendiente |
| **Reframe landing — pedagogía crítica** | 🔴 Alta | ✅ Done — Sprint 0 Mitos EdTech (2 abr) |
| **Sección Transparencia en landing** | 🔴 Alta | ✅ Done — IA, datos, método explícitos |
| **Momento Familia en landing** | 🔴 Alta | ✅ Done — flashcards como vínculo familiar |
| **Timer suave 30 min** | 🟡 Media | ✅ Done — anti-extractivismo atencional |
| **Voz del alumno en cierre sesión** | 🟡 Media | ✅ Done — micro-encuesta post-sesión |
| Modificaciones a prompts (escalación, emocional, mundos) | 🟡 Media | Pendiente — post 2 semanas de datos Beta 2 |
| Decisión modelo: routing Sonnet/Haiku | 🔴 Alta | Pendiente — análisis de costo listo |
| Estrategia contenido IG/TikTok (6 pilares pedagógicos) | 🟡 Media | Pendiente |

---

### FASE 2 — B2C → B2B Bridge (Mayo — Junio 2026)
**Meta:** Dashboard padres, base para colegios

| Feature | Prioridad | Notas |
|---------|-----------|-------|
| **Política de datos** | 🔴 Alta | **BLOQUEANTE** — debe completarse ANTES de schema Neon |
| Login (child + parent account) | 🔴 Alta | Requiere backend |
| Dashboard padres **cualitativo** | 🔴 Alta | Resúmenes narrativos + voz alumno, no solo XP/métricas |
| **Google Classroom integration** | 🔴 Alta | **MÁXIMA PRIORIDAD ESTRATÉGICA** — 1 teacher = ~35 alumnos automáticos |
| Reportes mensuales automáticos (email) | 🟡 Media | Base lista: Resend backend implementado |
| Alertas de frustración/patrones (NLP simple) | 🟡 Media | Base parcial: análisis post-sesión ya detecta patrones |
| Parametrización de dialecto (rioplatense/neutro) | 🟡 Media | Diseño en Fase 2, activación en Fase 3 |
| Modo Revisión (alumno trabaja solo, Toto revisa después) | 🟡 Media | 5to modo — anti-delegación de inteligencia |
| Vocabulario B2B académico (pedagogía crítica) | 🟢 Baja | Documento para pitch a colegios |

---

### FASE 3 — Premium (Julio 2026+)
**Meta:** Monetización, diferenciación de tiers

```
FREE:    1 sesión/día, 3 pistas, sin reportes padres
BASIC:   $4.99 USD/mes — sesiones ilimitadas, reportes email, dashboard
PRO:     $9.99 USD/mes — voice I/O, image gen, practice tests, personalización
SCHOOL:  $299/mes — usuarios ilimitados, teacher dashboard, analytics anonimizados
```

| Feature | Tier |
|---------|------|
| Voice I/O (speech-to-text + TTS) | PRO |
| Generador de imágenes (visual aid) | PRO |
| Practice tests ilimitados | PRO |
| Personalización visual de Toto | PRO |
| Teacher dashboard | SCHOOL |
| Reportes anonimizados por clase | SCHOOL |
| Sistema de badges completo | BASIC+ |
| **Timer configurable por padre** (20/30/45/sin límite) | BASIC+ |
| **Exportabilidad de datos del hijo** | **TODOS** (ético: nunca detrás de paywall) |
| **Dialecto regional activo** (rioplatense/neutro/otros) | TODOS |

---

### FASE 4 — B2B Escuelas (Q3 2026+)
**Meta:** Pilotos institucionales, contratos anuales

- Teacher login y dashboard de clase
- Reportes anonimizados (top preguntas, temas trabados)
- Integración SIS escolar (opcional)
- Sistema de certificación/badges institucional

---

## 🎯 FEATURE ESTRATÉGICA #1: Google Classroom Integration

**Por qué es la más importante:**
- 1 teacher habilitando Toto = ~35 alumnos automáticamente
- Contexto real de tarea (lo que el teacher asignó)
- Puente natural entre B2C (familias) y B2B (colegios)
- Diferenciación técnica difícil de replicar rápido

**Flujo básico:**
```
Teacher → "Tarea: problemas de fraccionarios p.45" en Classroom
Alumno → Abre Toto → Toto ya sabe qué tarea tiene
Toto → Tutoring contextualizado al enunciado real
```

**Dependencias técnicas:**
- Google OAuth (para teacher y alumno)
- Google Classroom API (leer assignments)
- Backend mínimo (guardar tokens OAuth)
- Requiere salir del single-file constraint

---

## 🏗️ CUANDO LLEGUE EL MOMENTO DE BACKEND

**Stack recomendado (simple):**
```
Node.js + PostgreSQL (o Firebase si queremos más rápido)

Tablas mínimas:
- users (child_id, parent_id, name, age)
- sessions (session_id, child_id, subject, xp, hints_used, mood)
- messages (message_id, session_id, role, content, timestamp)
```

**NO antes de validar core loop** — localStorage + serverless APIs (`api/email.js`, `api/analyze.js`) es suficiente para MVP y Fase 1.

---

## 🔍 APRENDIZAJES CLAVE DE COMPETENCIA

### EducaXD (competidor chileno)
- Responde directamente → opuesto filosófico a Toto
- Tiene 8 materias, multiidioma, base en Appwrite
- Flujo de invitación inverso (chico invita al padre) → considerar para v2

### Framing ganador
> "EducaXD te explica el tema. Toto te enseña a pensar con ese tema."
> No somos competidores — somos complementarios. Y eso nos protege.

---

## 💡 FEATURES PEDIDOS POR USUARIOS

| Feature | Pedido por | Prioridad | Estado |
|---------|-----------|-----------|--------|
| Inglés como materia | Ofek | 🟡 Media | ✅ Done |
| Practice tests para preparar examen | Ofek | 🟡 Media | ✅ Done |
| Modo exploración sin tarea | Insight de Ofek | 🟡 Media | Pendiente |

---

## 📌 LO QUE NO HACEMOS (SCOPE FREEZE)

Hasta validar el core loop con familias, NO se agrega:
- ⏸️ Backend/PostgreSQL → Neon en Fase 2 (con política de datos primero)
- ❌ Gift cards / redención de XP (v3)
- ❌ Videollamadas con tutores humanos
- ❌ Certificaciones formales
- ❌ Educación especial
- ❌ Otras edades o niveles
- ⏸️ Expansión regional/idiomas → Parametrización dialectal diseñada en Fase 2, activa en Fase 3

**Principios (Mitos EdTech):**
- ✅ Transparencia radical: datos, IA, método — siempre explícitos
- ✅ Acompañamiento, no solucionismo — Toto no "enseña", acompaña
- ✅ Codiseño con familias — feedback es parte del diseño, no buzón
- ❌ NUNCA gamificación adictiva, tracking invasivo, monetización de datos

**Razón:** Scope creep mata MVPs. Validar primero, escalar después.

