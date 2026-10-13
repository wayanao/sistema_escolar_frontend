# Funcionalidad: Entrevista de admisión — Frontend

## Control

- Estado: **Paso E4 escrito el 2026-10-13, sin commit** (la página de
  admisiones y la tarjeta en Años lectivos; ver "Avance del paso E4"). En el
  backend, el E1 está en producción y el E2 y el E3 en commits sin subir
  (`ee8aba2` y `d099c29`). **Esta página no se puede publicar antes de que E2
  y E3 estén en producción**: sin esas rutas, la tarjeta y la página darían
  error.
- Tipo: función nueva de producto. No es un módulo del plan de
  `docs/modularizacion/README.md`.
- **El documento principal es
  `sistema_escolar_api/docs/funcionalidades/ENTREVISTA_ADMISION.md`**: ahí
  están lo que se encontró, la investigación, las decisiones, qué va en cada
  formulario, la tabla, las rutas y el plan completo. Este documento cubre
  solo las pantallas.
- Vive en la preparación del año lectivo (decisión del usuario). Ver
  `docs/funcionalidades/ANIO_LECTIVO.md`.
- Depende de: los pasos E1 a E3 del backend (migración y rutas) en
  producción antes de usar las pantallas allá.
- Última actualización: 2026-10-13.

## Objetivo

1. Registrar aspirantes nuevos del año en preparación, hacerles la entrevista
   y dejar el resultado: aprobado o no aprobado.
2. Matricular a un aspirante aprobado sin volver a digitar lo que ya se
   escribió.
3. Que el formulario del estudiante deje de pedir lo que pasó a la entrevista.

## Decisiones ya tomadas (con el usuario, 2026-10-12)

Detalle en el documento principal. Las que cambian pantallas:

- Solo estudiantes **nuevos**. La promoción de quien continúa no cambia.
- **Bloquea:** un estudiante nuevo en el año en preparación solo se crea
  desde una admisión aprobada. Por eso "Crear estudiante en 2027" (en
  Estudiantes y en "Continuar la preparación") se reemplaza por el camino de
  admisiones.
- Resultados: Pendiente, Aprobado, No aprobado (este último pide el motivo).
- El frontend no decide nada de esto: el backend valida el año, la
  autorización, el motivo y quién se puede matricular; la pantalla oculta
  botones por comodidad y muestra el mensaje del backend tal cual.

Propuestas del asistente, **confirmadas por el usuario el 2026-10-13**: el
reparto de campos (tabla del documento principal), copiar a la ficha del
estudiante al matricular, una página propia para admisiones a la que se llega
desde la preparación del año, y poder borrar una admisión no matriculada.

Decidido el mismo día: **quien entrevista se escribe a mano** (campo de
texto), no se elige de los usuarios del sistema.

## Arquitectura (según las capas del proyecto)

Módulo nuevo `admisiones`, con la misma estructura que los demás:

| Pieza | Archivo propuesto | Qué hace |
|---|---|---|
| Servicio | `src/services/admisionesApi.js` | Único punto HTTP: listar, registrar, ver, editar, resultado, borrar y matricular |
| Contrato puro | `src/utils/admisiones/` | Estado inicial, normalizar respuestas, armar cuerpos, validar, etiquetas de resultado |
| Consultas | `src/hooks/admisiones/useConsultasAdmisiones.js` | Lista del año, filtro por resultado, recarga |
| Comandos | `src/hooks/admisiones/useComandosAdmision.js` | Registrar, editar entrevista, resultado, borrar, matricular |
| Vistas | `src/components/admisiones/` | Lista, formulario del aspirante, formulario de la entrevista, resultado |
| Página | `src/pages/AdmisionesAdmin.jsx` | Ruta `/admin/anios-lectivos/admisiones` (`AdminRoute`) |

- El año viene del proveedor de años lectivos (`useAnioLectivo`): la página
  trabaja con el año en `preparacion`. Sin año en preparación, dice cómo
  crearlo y no muestra nada más.
- Ningún módulo importa de `utils/` de otro módulo (regla del `CLAUDE.md`).
  Lo que se comparta con Estudiantes (por ejemplo, los tipos de documento) se
  sube a `src/constants/` o a la raíz de `src/utils/`.

## Pantallas

### Acceso desde la preparación del año

En la página de años lectivos, con un año en preparación, una tarjeta
"Admisiones {año}" con los conteos (pendientes, aprobados, no aprobados,
matriculados) y el botón "Ir a admisiones". Reemplaza al enlace "Crear
estudiante en {año}" de "Continuar la preparación".

### Página de admisiones

- Lista de aspirantes del año con su resultado (filtro por resultado) y
  botón "Nuevo aspirante".
- **Nuevo aspirante:** nombre, apellidos, tipo y número de documento, fecha
  de nacimiento, curso del año al que aspira (los cursos de ese año),
  acudiente (nombre, parentesco, teléfono) y la **autorización de datos**
  (casilla obligatoria y quién autoriza), con un texto corto que explique
  para qué se usan los datos.
- **Entrevista** (por aspirante): fecha, quién entrevistó, quiénes
  asistieron, estudios anteriores (colegio, año cursado, preescolar, EBP,
  motivo del retiro, paz y salvo), ocupación del padre y de la madre, con
  quién vive, qué espera la familia y observaciones.
- **Resultado:** Aprobado o No aprobado (este pide el motivo). Se puede
  cambiar mientras no esté matriculado.
- **Matricular** (solo aprobados): abre la ficha del estudiante con los datos
  del aspirante ya puestos; el admin completa dirección, salud y padres y
  guarda. Después, la admisión queda de solo consulta con el enlace al
  estudiante.
- **Exalumno que vuelve** (decisión 11 del documento principal): si la
  admisión trae `aviso_documento`, matricular usa ese mismo estudiante y
  **reemplaza su ficha** como `PUT /estudiantes/{id}`. Por eso, en ese caso,
  la ficha se llena con lo que el estudiante ya tiene (leyéndolo por
  `aviso_documento.estudiante_id`) y encima los datos del aspirante; si no,
  se perderían datos como `condicion_diagnostico`.
- Móvil: tarjetas en una columna, formularios a ancho completo, botones a
  ancho completo (como el resto de años lectivos).

### Formulario del estudiante (paso E6)

- Sale la sección "Estudios Anteriores" y la ocupación del padre y de la
  madre.
- El cuerpo no cambia: los campos siguen en el estado inicial (vacíos al
  crear en el año activo) y, al editar, se devuelve lo que ya tenía el
  estudiante. No se pierde ningún dato.
- La ficha del estudiante muestra, de solo lectura, "Datos de admisión": lo
  que se copió de su entrevista o, en estudiantes de antes, lo que ya tenían
  guardado.

## Plan de pasos de este repo

Numeración compartida con el backend (plan completo en el documento
principal).

| Paso | Qué |
|---|---|
| E4 | Página de admisiones: servicio, contrato, hooks, vistas, ruta y tarjeta de acceso. Lista, nuevo aspirante, entrevista y resultado. **Escrito el 2026-10-13, sin commit** |
| E5 | Matricular desde una admisión aprobada; quitar "Crear estudiante en {año}" de Estudiantes y de "Continuar la preparación" |
| E6 | Formulario del estudiante sin lo que pasó a la entrevista; "Datos de admisión" en la ficha |

Cada paso empieza con caracterización, escribe las pruebas antes del código,
termina con `pnpm run check:deploy` y `git diff --check`, actualiza este
documento y se detiene antes del siguiente.

## Pruebas

- `src/utils/admisiones/*.test.js`: normalizar, cuerpos, validación,
  etiquetas.
- `src/services/admisionesApi.test.js`: rutas y cuerpos de cada llamada.
- Hooks: carga, filtro, respuestas viejas descartadas, cada comando y sus
  errores con el mensaje del backend.
- Página: flujo completo (registrar → entrevista → aprobar → matricular) y
  "no aprobado" con motivo.
- Formulario del estudiante: lo que sale ya no se ve; el cuerpo al crear y al
  editar no cambia.

## Fuera de alcance

- Cualquier regla de admisión decidida en el frontend: la decide el backend.
- Estudiantes que llegan a mitad del año activo, prueba diagnóstica, lista de
  espera y formato impreso (ver el documento principal).

## Preguntas abiertas

Las mismas del documento principal. Las de antes de E1 (reparto de campos y
propuestas), la de quién entrevista y la del exalumno que vuelve quedaron
respondidas el 2026-10-13. Para este repo no queda ninguna abierta antes de
E4.

Para el E5: el contrato de todas las rutas (cuerpos, respuestas,
errores, `editable`, `aviso_documento`, resultado y matricular) está en
`sistema_escolar_api/docs/API_ENDPOINTS.md`, sección "Admisiones". La
pantalla oculta botones con `editable`, no con su propia regla.

## Avance del paso E4 (2026-10-13)

- Autorizado explícitamente por el usuario ("Empezar el E4", elegido frente a
  probar primero E2 y E3 en local). Al iniciar, los dos repos estaban en
  `main` y limpios, sin subir: backend `d099c29` (E3), frontend `0e13fb1`.
- Caracterización antes de tocar: una prueba nueva en
  `FormularioEstudianteAdmin.test.jsx` fija las opciones de tipo de documento
  y paz y salvo (pasó antes y después del cambio). Línea base de los tres
  archivos que se iban a tocar (formulario, Años lectivos y `App`): 55
  pruebas pasando.
- Pruebas primero, 76 nuevas en total; antes del código fallaban los 9
  archivos nuevos y las pruebas de la tarjeta y de la ruta.
  - `utils/admisiones/admisiones.test.js` y `formularios.test.js`: leer la
    lista, etiquetas, filtro en el navegador, conteos, mensajes (también un
    422 en lista), estado inicial, llenar desde el backend, cuerpos
    (recortados, vacíos como `null`, registrar solo el aspirante, editar con
    la entrevista, resultado aparte) y validación.
  - `services/admisionesApi.test.js`: rutas y cuerpos de las seis llamadas.
  - `hooks/admisiones/`: la lista (sin año no pide; filtrar no pide; cursos
    solo si se piden; respuesta vieja descartada; mensaje del backend) y los
    comandos (validación sin llamar al backend, registrar y pasar a la ficha,
    errores del backend, guardar entrevista, resultado con motivo, borrar,
    cambiar de año cierra todo).
  - Vistas: tarjeta, lista (filtros, insignias, vacío) y ficha (guardar,
    resultado, solo consulta si no es `editable`, aviso del documento).
  - `pages/AdmisionesAdmin.test.jsx`: el flujo completo con el backend
    doblado. `AniosLectivosAdmin.test.jsx`: la tarjeta (una petición, solo con
    año en preparación). `App.test.jsx`: la ruta es de admin y un profesor
    termina en `/login`.
- Código:
  - `services/admisionesApi.js`; `utils/admisiones/admisiones.js` y
    `formularios.js`; `hooks/admisiones/useConsultasAdmisiones.js` y
    `useComandosAdmision.js`; `components/admisiones/` (tarjeta, encabezado,
    lista, nuevo aspirante, ficha, formularios del aspirante y la entrevista,
    resultado y campos); `pages/AdmisionesAdmin.jsx`; la ruta en `App.jsx`;
    la tarjeta en `AniosLectivosAdmin.jsx`.
  - `constants/documentosEstudiante.js`: tipos de documento y paz y salvo,
    sacados del formulario del estudiante, que ahora los importa.
- Decisiones de detalle (dentro del diseño):
  - El filtro se aplica en el navegador: cambiarlo no pide nada (meta del
    usuario de bajar peticiones). La lista trae todo el año y es corta.
  - Al registrar, la página abre la ficha del aspirante para seguir con la
    entrevista, sin otra petición (el backend responde la admisión completa).
  - La página usa siempre el año en preparación, no el del selector, y el
    selector no aparece en ella.
  - "Borrar" (decisión 9) quedó en la ficha, con confirmación; no estaba en la
    fila del E4 de la tabla pero sí en el servicio y los comandos del diseño.
  - El motivo de "No aprobado" lleva una ayuda: un motivo objetivo, y que la
    admisión no puede negarse por religión, origen o composición de la
    familia.
  - "Crear estudiante en {año}" sigue en "Continuar la preparación": se quita
    en el E5, junto con "Matricular".
  - Sin entrada nueva en el menú: se llega desde Años lectivos.
- Verificación: 130 pruebas de los archivos del paso; `pnpm run
  check:deploy` → **2485 pruebas en 364 archivos**, lint y build limpios;
  `git diff --check` limpio. Una corrida intermedia de `check:deploy`, ya
  solo con cambios de documentos, falló con "9 unhandled errors" (355
  archivos, 2405 pruebas): es la falla al azar por carga de la máquina ya
  conocida. La siguiente corrida de todas las pruebas y la de `check:deploy`
  completo pasaron sin errores. **No se ha visto en un navegador ni contra un
  backend real.**

## Entrega para el siguiente chat

- Estado al 2026-10-13: **paso E4 escrito, sin commit** (ver "Avance del
  paso E4"). En el backend, el E1 está en producción y el E2 y el E3 en
  commits sin subir (`ee8aba2` y `d099c29`).
- Siguiente acción exacta: probar en local juntos el backend (E2 y E3) y esta
  página contra una rama de Neon: backend local con `$env:DATABASE_URL` en la
  rama, frontend local, y como admin recorrer Años lectivos (tarjeta) →
  Admisiones → nuevo aspirante → entrevista → resultado → borrar, en
  escritorio y en móvil. Después, subir primero el backend y esperar a que
  Render quede **Live**, y solo entonces el frontend (si no, la tarjeta y la
  página darían error). El E5 (matricular desde la admisión y quitar "Crear
  estudiante en {año}") necesita su propia autorización.
- Prompt para retomar: `docs/funcionalidades/PROMPT_CONTINUACION_ENTREVISTA_ADMISION.md`.
