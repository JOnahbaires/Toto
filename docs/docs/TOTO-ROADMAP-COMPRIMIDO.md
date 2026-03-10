# 🚀 TOTO EL TUTOR — ROADMAP PRIORIZADO (Marzo 2026)
> Versión comprimida. El roadmap completo vive en toto-roadmap-features.md

---

## 📍 ESTADO HOY

- ✅ MVP deployado en toto-rust.vercel.app
- ✅ Testing con ~5 niños (incluye Ofek)
- ✅ Todos los features core del MVP implementados (ver TOTO-ESTADO-TECNICO.md)
- 🔄 Validando core loop antes de agregar complejidad

---

## 🗓️ FASES

### FASE 1 — Validación MVP (Marzo — Abril 2026)
**Meta:** 5 niños, feedback real, 70 familias pagando

| Feature | Prioridad | Estado |
|---------|-----------|--------|
| Fix encoding descarga sesión | 🔴 Alta | Propuesta pendiente |
| Pruebas de práctica (Practice Test Mode) | 🟡 Media | TODO |
| Inglés como materia | 🟡 Media | TODO |
| Modo exploración sin tarea específica (Explore Mode) | 🟡 Media | TODO |

---

### FASE 2 — B2C → B2B Bridge (Mayo — Junio 2026)
**Meta:** Dashboard padres, base para colegios

| Feature | Prioridad | Notas |
|---------|-----------|-------|
| Login (child + parent account) | 🔴 Alta | Requiere backend |
| Dashboard padres (sessions, XP, reportes) | 🔴 Alta | Requiere backend |
| **Google Classroom integration** | 🔴 Alta | **MÁXIMA PRIORIDAD ESTRATÉGICA** — 1 teacher = ~35 alumnos automáticos |
| Reportes mensuales automáticos (email) | 🟡 Media | EmailJS actual es base |
| Alertas de frustración/patrones (NLP simple) | 🟡 Media | - |

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

**NO antes de validar core loop** — localStorage es suficiente para MVP y Fase 1.

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

| Feature | Pedido por | Prioridad |
|---------|-----------|-----------|
| Inglés como materia | Ofek | 🟡 Media |
| Practice tests para preparar examen | Ofek | 🟡 Media |
| Modo exploración sin tarea | Insight de Ofek | 🟡 Media |

---

## 📌 LO QUE NO HACEMOS (SCOPE FREEZE)

Hasta validar el core loop con familias, NO se agrega:
- ❌ Backend/PostgreSQL
- ❌ Gift cards / redención de XP (v3)
- ❌ Videollamadas con tutores humanos
- ❌ Certificaciones formales
- ❌ Educación especial
- ❌ Otras edades o niveles
- ❌ Expansión regional/idiomas

**Razón:** Scope creep mata MVPs. Validar primero, escalar después.
