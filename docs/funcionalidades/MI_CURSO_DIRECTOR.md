# Funcionalidad: "Mi curso" del director de grupo — Frontend

## Control

- Estado: **pasos 2 y 4 construidos el 2026-11-07.** El paso 2 tiene commit;
  el 4, no todavía.
- El documento principal (datos, permisos, migración y preguntas abiertas) es
  `sistema_escolar_api/docs/funcionalidades/MI_CURSO_DIRECTOR.md`.
- Tipo: función nueva de producto en la pantalla Boletín Final del profesor
  (`/ingreso-boletin`). No reabre el módulo `boletines`.
- Pasos de esta pantalla: 2 y 4. Cada uno va después de su paso del backend.
- Última actualización: 2026-11-07.

## Objetivo

Que el profesor que es director de grupo vea, en Boletín Final, el ranking de
su curso (puesto, promedio, la definitiva de cada materia e inasistencias del
periodo) y llene ahí la observación general de cada estudiante, la que sale en
el boletín.

## Paso 2 — Pestaña "Mi curso (director de grupo)"

- Solo aparece si `GET /director-grupo/cursos` trae al menos un curso. Los
  demás profesores no ven cambios.
- Arriba, dos pestañas: "Mis materias" (lo de hoy) y "Mi curso (director de
  grupo)". El periodo es el mismo selector de la pantalla.
- PC: tabla Puesto · Estudiante · Promedio · una columna por materia ·
  Inasistencias del periodo. Celular: una tarjeta por estudiante.
- Preescolar: carita en vez de número, como en el boletín.
- Aviso por materia sin guardar: «Inglés: faltan 12 por guardar», porque el
  puesto sale de lo guardado. **Rediseñado el 2026-11-07** (el usuario lo veía
  desordenado: un renglón corrido que repetía al profesor): una tarjeta por
  profesor, primero quien tiene más materias pendientes, con una tablita
  «Materia · Guardados» («0 de 15» y una barrita de avance); en columnas
  desde 1024 px. Profesores y materias siguen en MAYÚSCULAS.
- Archivos previstos: `services/boletinesApi.js` (dos lecturas),
  `utils/boletines/` (normalizar la respuesta), un hook de consulta nuevo en
  `hooks/boletines/`, un componente nuevo en `components/boletin/` y la página
  `IngresoBoletinProfesor.jsx`. Documentar en `API_CLIENT.md` y
  `COMPONENTES.md`.
- Diseño para profesores mayores: una sola acción principal por zona y textos
  que dicen exactamente lo que hacen.

### Avance del paso 2 (2026-11-07)

- Construido como se describe arriba: `listarCursosDirigidos` y
  `obtenerMiCursoDirector` en el servicio, `utils/boletines/miCurso.js`,
  `useConsultaMiCursoDirector` (pide el ranking solo con la pestaña abierta y
  descarta respuestas viejas), `MiCursoDirector.jsx`, pestañas en la vista.
- Notas sin guardar en gris y cursiva; en celular, materias en una columna
  para leer el nombre completo (pedido de diseño para profesores mayores).
- Probado con pruebas y en el navegador con servidor simulado. Para probarlo
  en local con datos reales hay que asignar un director a un curso del
  Colegio Demo (Cursos → Editar → Director de grupo): hoy ninguno lo tiene.

## Paso 4 — Observación general en cada fila, e impreso

### Avance del paso 4 (2026-11-07)

- Construido: caja por estudiante (debajo de su fila en PC, al final de la
  tarjeta en celular), contador de 500, un botón «Guardar observación de …»
  que, ya guardada, pasa a gris «Observación guardada», y borrador automático
  con aviso al recuperar. El impreso del admin sale con la guardada y se puede
  retocar solo para esa impresión (decisión del usuario: «Igual que hoy»).
- Probado con pruebas y en el navegador con servidor simulado.

- En cada fila (o tarjeta), la caja "Observación general" con su botón
  «Guardar observación de …», y el mismo borrador automático del boletín
  (lo no guardado no se pierde al salir).
- El boletín impreso del admin (`BoletinImprimible`) muestra lo guardado.
- Preguntas abiertas: ver el documento principal.
