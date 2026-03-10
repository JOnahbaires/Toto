# 📚 Índice Maestro de Proyectos — Jonah Baires

> Referencia centralizada de todos los proyectos, su contexto, y cómo Claude debe acceder a ellos.
> Última actualización: Marzo 2026

---

## 🎯 Propósito

Este archivo es una brújula para Claude. Cuando trabajés en cualquier proyecto, Claude lee este índice primero y sabe exactamente qué memoria consultar, dónde está el código, y cómo los proyectos se relacionan entre sí.

---

## 📌 TOTO EL TUTOR

**Estado**: MVP deployado, validando core loop  
**Fundador**: Jonah Baires  

### ¿Qué es?
App web de tutoría socrática con IA para estudiantes de 6° grado en Buenos Aires. El tutor hace preguntas en lugar de dar respuestas, involucra padres en momentos clave, y premia el esfuerzo.

### 📂 Dónde vive el código
- **Repo público**: https://github.com/JOnahbaires/Toto
- **Deploy en vivo**: https://toto-rust.vercel.app
- **Rama principal**: `main`
- **Estructura**: Single-file (`index.html`) + proxy serverless (`api/chat.js`)

### 📖 Documentación (léela en este orden)
1. **TOTO-CONTEXTO-MAESTRO.md** — Todo lo que Claude necesita saber para trabajar en Toto. Identidad, stack, restricciones, principios no negociables.
2. **TOTO-ESTADO-TECNICO.md** — Arquitectura actual, bugs conocidos, decisiones técnicas, cómo hacer cambios seguros.
3. **TOTO-ROADMAP-COMPRIMIDO.md** — Features priorizadas, fases (MVP → B2B), decisiones estratégicas.
4. **ANALISIS-FEEDBACK-THIAGO.md** — Insight de dinámica madre-hijo, pain points reales, oportunidades para Toto.

### 🔧 Stack técnico
```
Frontend:   index.html (single-file, todo el código)
Backend:    api/chat.js (proxy a Anthropic API)
AI:         claude-haiku-4-5 via Anthropic API
Hosting:    Vercel (deploy automático)
Email:      EmailJS (reportes de sesión)
Storage:    localStorage (no DB todavía)
```

### 👤 Stakeholders
- **Jonah** (Founder): jonah.baires@gmail.com — aprueba todos los cambios
- **Ofek** (Tester temprano): validó método socrático, pidió inglés y practice tests
- **Thiago** (Alumno): caso de uso madre-hijo con dinámicas de aprendizaje

### 🚀 Próximos hitos
- **Fase 1 (Marzo-Abril)**: Validar MVP con 5 niños, 70 familias pagando
- **Fase 2 (Mayo-Junio)**: Dashboard padres, Google Classroom integration (máxima prioridad estratégica)
- **Fase 3 (Julio+)**: Premium tiers (FREE / BASIC $4.99 / PRO $9.99 / SCHOOL $299)

### 🔒 Principios no negociables
1. Método socrático inviolable — nunca dar respuesta directa
2. Esfuerzo > corrección — XP por intentar, no por acertar
3. 3-hint limit → Parent Checkpoint Mode
4. Voz rioplatense auténtica ("posta", "che", "dale")
5. Velocidad — respuestas <2s

### ⚙️ Cómo trabajar con Claude en Toto
1. Claude lee código directo de GitHub (sin adjuntos)
2. Propone cambio antes de ejecutar
3. Jonah aprueba → Jonah pushea si aprueba
4. Todos los cambios van en `index.html` (single-file constraint)
5. Python `str.replace()` para editar, no `sed`

---

## 📋 ORQUESTADOR

**Estado**: A definir  
**Propósito**: Orquestar desarrollos entre proyectos (Toto + futuros)  

### ¿Qué es?
Sistema de coordinación para que Claude sepa cómo priorizar, coordinar, y ejecutar tareas que afecten múltiples proyectos. Entiende dependencias, roadmaps, y restricciones de cada uno.

### 📂 Dónde vivirá
- **Repo**: [A DECIDIR — ¿mismo repo que Toto o repo separado?]
- **Formato**: [A DECIDIR — ¿documento + código, o solo documentación?]

### 📖 Documentación
- **ORQUESTADOR-CONTEXTO.md** (próximo a crear)
- **ORQUESTADOR-PLAYBOOK.md** (próximo a crear)

### 🔧 Stack técnico
[Pendiente de diseño]

### 👤 Stakeholders
- **Jonah** (Requester): jonah.baires@gmail.com

### 🚀 Próximos pasos
1. Definir estructura (repo, formato, alcance)
2. Crear documentación de contexto
3. Integrar con memoria de Toto

---

## 🔄 Relaciones entre proyectos

```
ORQUESTADOR
    ↓
    └─→ coordina tareas de TOTO
    └─→ (en futuro: coordina tareas de otros proyectos)
```

---

## 📞 Cómo usar este índice

### Para Jonah
- **Antes de trabajar en un proyecto**: "Claude, estoy en [PROYECTO], lee el índice"
- **Cuando agregues un proyecto nuevo**: "Claude, agregá [PROYECTO NUEVO] al índice"
- **Cuando cambies algo importante**: "Claude, actualizá el índice"

### Para Claude
- **Al inicio de cada sesión**: Leo automáticamente este archivo
- **Cuando me pidas que orqueste**: Consulto este índice, luego leo la memoria de cada proyecto
- **Cuando agregues proyectos**: Vos decís, yo actualizo

---

## 🗓️ Histórico de cambios

| Fecha | Cambio | Quién |
|-------|--------|-------|
| Marzo 2026 | Creación inicial, indexación de TOTO | Claude |
| [fecha] | [cambio] | [quién] |
