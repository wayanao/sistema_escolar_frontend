# Funcionalidad: Año lectivo — Frontend

## Control

- Estado: **Diseñado, nada implementado.** Ninguna fase iniciada.
- Tipo: Función nueva de producto. No es un módulo del plan de
  `docs/modularizacion/README.md` y no debe confundirse con uno.
- Repos afectados: este repo y `sistema_escolar_api`. **El documento
  principal es `sistema_escolar_api/docs/funcionalidades/ANIO_LECTIVO.md`**:
  ahí están el diagnóstico, el modelo de datos, las decisiones, las fechas
  límite y el plan de fases completo. Este documento cubre solo las
  pantallas.
- Riesgo: Alto en conjunto (dinero, migraciones y datos académicos), bajo en
  este repo si se respeta la regla "con el año activo, las peticiones son
  idénticas a las de hoy".
- Depende de: fases 1 a 3 del backend en producción antes de la fase 4 de
  este repo.
- Última actualización: 2026-10-01.

## Objetivo

1. Un selector de año **discreto**, solo para el admin, que no aparece
   mientras el colegio tenga un solo año. Hoy, en producción, no cambia nada
   visible.
2. Cuando el admin mira un año que no es el activo, un aviso claro de "solo
   consulta" y las pantallas cargando los datos de ese año.
3. Una pantalla de admin para preparar el año siguiente (copiar cursos,
   matricular) y activarlo.
4. Que en la pantalla de pagos se pueda elegir a qué año va un pago cuando
   existe un año en preparación o hay deuda de años anteriores.
5. Que el profesor pueda empezar 2027 con el planeador anual y los planes de
   clase de 2026 como base.

## Decisiones ya tomadas (con el usuario, 2026-09-29)

Las decisiones numeradas (17 al 2026-09-30) están en el documento del
backend. Las que cambian pantallas:

- Cursos nuevos cada año → los selectores de curso muestran solo los del
  año que se está mirando.
- Solo el admin consulta años pasados; los profesores ven solo el año
  activo → **el profesor no tiene selector** y sus pantallas no cambian.
- La deuda de años anteriores se ve aparte → estado de cuenta y cartera
  muestran una línea o columna "Años anteriores".
- Un pago se registra en el año de la deuda que salda → la pantalla de
  pagos permite elegir el año del pago.
- No se activa el año nuevo sin decidir por cada estudiante → la pantalla
  de activación muestra los pendientes y no deja continuar.
- Renombrar una materia que se usa en otro año: avisar y dejar elegir
  (decisión 12) → diálogo en la edición de materias.
- Planeador anual: lo trae el profesor con un botón, solo si su planeador
  está vacío (decisión 14), aunque el de 2026 lo haya escrito otro profesor
  (decisión 15).
- Planes de clase: el profesor usa uno de 2026 como base al crear uno nuevo;
  se copia solo el texto, no las evidencias (decisión 16).
- Conceptos de pago por año (decisión 17) → la pantalla de Tipos de pago
  muestra y edita los conceptos del año que se está mirando. Al preparar
  2027 se copian siempre, y el admin los ajusta mirando 2027 (por ejemplo,
  la mensualidad desde febrero) sin tocar 2026.
- Un año cerrado se ve como se veía al cerrarse (decisión 13) → no cambia
  nada en el frontend: el boletín que llega del backend ya viene así.

Decisiones de diseño de este repo (propuestas por el asistente, a confirmar
al empezar la fase 4):

- **El año elegido no se guarda entre sesiones.** Al entrar, siempre es el
  año activo. Vive en memoria (estado de React): recargar la página vuelve
  al año activo. Así nadie queda trabajando en un año viejo sin darse
  cuenta, y no se agrega ninguna clave nueva a `localStorage`.
- **El frontend no decide qué es editable.** El backend devuelve el estado
  de cada año; la pantalla oculta o desactiva botones por comodidad, pero la
  protección real es el 409 del backend, que se muestra tal cual.

## Arquitectura (según las capas del proyecto)

El año se usa en muchos módulos, así que su contrato va en la raíz de
`src/utils/`, igual que `src/utils/nivelAcademico.js`. Ningún módulo copia
constantes de otro (regla del `CLAUDE.md`).

| Pieza | Archivo propuesto | Qué hace |
|---|---|---|
| Servicio | `src/services/aniosLectivosApi.js` | Único punto HTTP: listar años; en la fase 5, crear, copiar, matricular, activar |
| Contrato puro | `src/utils/anioLectivo.js` | Normalizar la respuesta, encontrar el activo, etiqueta "2026 · Cerrado", y `parametrosAnio(seleccionado, activo)` |
| Estado compartido | `src/hooks/anioLectivo/AnioLectivoProvider.jsx` + `useAnioLectivo.js` | Carga los años una vez y guarda cuál se está mirando |
| Vistas | `src/components/anioLectivo/SelectorAnioLectivoView.jsx`, `AvisoAnioLectivoView.jsx` | Solo presentación, reciben datos y funciones por props |

### La regla que protege producción

`parametrosAnio` devuelve `{}` cuando se mira el año activo y
`{ anio_lectivo_id }` solo cuando se mira otro. Consecuencia: **mientras el
admin mire el año activo, cada petición es idéntica, byte a byte, a la de
hoy.** Las pruebas de servicio de cada módulo lo comprueban.

### Por qué un Context (patrón nuevo en este repo)

Hoy ninguna parte del proyecto usa `createContext`; las selecciones de
trabajo, como el periodo del profesor (`src/utils/periodoProfesor.js`), van
en `localStorage`. Para el año no sirve: la barra de navegación y la página
abierta necesitan el mismo valor, y la página tiene que recargar sus datos
en el momento en que el admin cambia de año. `localStorage` no avisa a los
componentes que ya están en pantalla. Un Context de React es la herramienta
estándar para eso. Se limita a este único caso y se documenta en
`docs/ARQUITECTURA_FRONTEND.md` al implementarlo.

- El proveedor envuelve solo el layout autenticado del admin (`Layout` en
  `src/App.jsx`).
- `useAnioLectivo()` usado fuera del proveedor (pantallas del profesor,
  pruebas de página existentes) devuelve el comportamiento de hoy: año
  activo, sin parámetros, editable. Así ninguna pantalla del profesor ni
  ninguna prueba existente necesita cambios.

### Dónde se ve

- **Selector**: en `NavAdminView`, con el mismo patrón que
  `renderNotificaciones`: la vista recibe una función que dibuja el
  selector, sin importar hooks. Oculto si hay un solo año.
- **Aviso de solo consulta**: debajo de la navegación, en el mismo lugar y
  con el mismo estilo que `TenantStatusBannerView` (`AvisoEstadoTenant` en
  `src/App.jsx`). Texto propuesto: "Estás viendo el año 2026 (cerrado).
  Solo consulta." con un botón "Volver a 2027". Para un año en preparación:
  "Estás preparando el año 2027."

## Plan de fases (numeración compartida con el backend)

Las fases 0 a 3 son solo del backend. Este repo empieza en la fase 4.

### Fase 4 — Selector y pantallas por año

1. Servicio, contrato puro, proveedor y vistas de la tabla anterior, cada uno
   con sus pruebas.
2. Consultas que pasan a depender del año. Cada hook agrega el año a sus
   dependencias para recargar cuando cambia, y cada servicio acepta
   `params` opcionales. Inventario del 2026-09-29 (confirmar con `grep` al
   empezar):
   - Cursos: `hooks/administracionAcademica/useCursos.js`,
     `useDatosAsignaciones.js`.
   - Boletines: `hooks/boletines/useConsultaBoletinesAdministrativos.js`,
     `useConsultaOrdenBoletin.js`.
   - Certificados: `hooks/certificadosImpresion/useConsultasCertificadosAdmin.js`.
   - Estudiantes: `hooks/estudiantesObservador/useListadoEstudiantesAdmin.js`.
   - Pagos: el listado de estudiantes de `services/pagosApi.js` y las deudas
     de `services/estudiantesObservadorApi.js`.
   - Cartera y tipos de pago: `services/carteraTiposPagoApi.js` (resumen,
     detalle, listado de conceptos y cursos para tipos de pago).
   - Dashboard del admin, listas de seguimiento y observador del admin: se
     confirman al empezar.
3. Pantallas que **no** dependen del año (inventario, ventas, egresos,
   nómina, préstamos, diseño de impresos): ignoran el selector. Pregunta de
   diseño para esta fase: ¿el selector se esconde en esas pantallas o se
   muestra desactivado con la nota "Esta sección no depende del año"?
4. Mirando un año que no es el activo: botones de crear, editar y borrar
   ocultos o desactivados en las pantallas académicas. Si igual llega un
   409 del backend, se muestra su mensaje tal cual.
5. Materias (`hooks/administracionAcademica/useComandosMaterias.js`): si al
   renombrar llega el 409 con el código de "materia usada en otro año", se
   muestra un diálogo con el mensaje del backend y dos botones:
   "Cambiar igual", que reenvía con la confirmación, y "Crear una materia
   nueva", que abre el formulario de crear con el nombre nuevo. El frontend
   no calcula si la materia se usa en otro año: lo dice el backend.
5. Terminado cuando: con un solo año no cambia nada visible (prueba de
   composición de `App`); con dos años, cada pantalla del inventario muestra
   lo del año elegido; `pnpm run check:deploy` pasa; el usuario lo revisa en
   local.

### Fase 5 — Preparar el año siguiente

1. Página nueva `/admin/anios-lectivos` (guard `AdminRoute`), con tres
   pasos:
   1. **Crear 2027 y copiar** cursos, con casillas para precios, carga
      académica y director de grupo. Los conceptos de pago se copian
      siempre, sin casilla.
   2. **Matricular**: por curso de origen, elegir el curso destino, ver la
      lista y desmarcar a quien no pasa con ese grupo. Los valores
      especiales copiados aparecen marcados "revisar".
   3. **Resumen** de lo preparado (el botón de activar llega en la fase 6).
2. Estudiantes: al crear uno mientras se mira 2027, el formulario ofrece los
   cursos de 2027.
3. Pagos: si existe un año en preparación o el estudiante tiene deuda de
   años anteriores, aparece un selector "Año del pago". Por defecto, el año
   activo.
4. Deuda de años anteriores (decisión 2): el detalle de deudas del
   estudiante en Pagos y Cartera vencida la muestran aparte, por año. Tiene
   que estar en producción **antes de activar 2027** (fase 6): desde ese
   día, lo que se deba de 2026 solo llega en ese campo.
5. Documentación: `RUTAS_FRONTEND.md` (ruta nueva), `API_CLIENT.md`,
   `COMPONENTES.md`, `ROLES_UI.md` (la entrada de menú del admin),
   `CAMBIOS_FRONTEND.md`.

Contrato del backend ya listo para los puntos 3 y 4 (su fase 2, código del
2026-10-01; ver `sistema_escolar_api/docs/API_ENDPOINTS.md`):

- `POST /pagos` y `POST /pagos/adelanto` aceptan `anio_lectivo_id` opcional
  en el cuerpo. `GET /estudiantes/{id}/deudas`,
  `GET /pagos/vencidos/opciones/{id}` y `GET /pagos/adelanto/opciones/{id}`
  lo aceptan como parámetro opcional (`?anio_lectivo_id=`). Sin él, todo es
  del año activo, como hoy, así que el frontend actual sigue igual.
- `GET /estudiantes/{id}/deudas` y cada estudiante de `GET /cartera/mora`
  traen `deuda_anios_anteriores`: una lista por año con `anio_lectivo_id`,
  `anio`, `curso_id`, `deudas` y `total_deuda`, aparte de la deuda del año.
  En cartera puede venir un estudiante con `total` 0 que solo debe de años
  anteriores. `GET /cartera/mora/resumen` trae `total_anios_anteriores`.
  Mientras haya un solo año, la lista viene vacía y el total en 0.

### Fase 6 — Activar el año

1. En la página de años lectivos: vista previa con cuántos pasan, cuántos
   quedan retirados por "no continúa" y la **lista de los que faltan por
   decidir**. Con alguno pendiente, el botón de activar queda bloqueado.
2. Confirmación fuerte antes de activar: escribir el año, por ejemplo
   "2027", porque el paso cierra el año actual para todos, incluidos los
   profesores.
3. Reabrir y volver a cerrar un año pasado, con la misma confirmación.

### Fase 7 — Reutilizar el planeador anual y los planes de clase

Pantallas del profesor. Depende de la fase 7 del backend.

1. **Planeador anual** (`pages/PlaneadorAnual.jsx`,
   `hooks/mallaCurricular/`): si el backend dice que hay origen y que el
   planeador está vacío, aparece el botón "Traer el planeador del año
   pasado". Al usarlo, recarga el planeador. Las fechas quedan vacías para
   que el profesor ponga las de 2027. Si el backend responde 409 porque ya
   hay algo escrito, se muestra su mensaje y no se toca nada.
2. **Plan de clases** (`pages/PlanDeClases.jsx`, `hooks/planeaciones/`): en
   el formulario de crear, un botón "Usar un plan del año pasado". Abre la
   lista que da el backend (fecha, periodo, unidad, tema); al elegir uno, se
   llenan los campos de texto del formulario. La fecha y las evidencias
   quedan vacías y el plan se envía por el guardado normal, como uno nuevo.
3. Terminado cuando: el botón del planeador solo aparece con origen y
   planeador vacío; al elegir un plan base, el formulario se llena sin
   fecha ni evidencias; `pnpm run check:deploy` pasa; el usuario lo revisa en
   local con un profesor de prueba.

## Pruebas

- `src/utils/anioLectivo.test.js`: normalización, año activo, etiquetas y,
  sobre todo, `parametrosAnio` devolviendo `{}` con el año activo.
- `src/services/aniosLectivosApi.test.js`: rutas y cuerpos.
- Proveedor y hook: carga una vez, cambio de año, comportamiento fuera del
  proveedor.
- En cada servicio tocado: la petición con el año activo es idéntica a la de
  hoy, y con otro año lleva `anio_lectivo_id`.
- Una prueba de caracterización por página del inventario, antes de
  tocarla.

## Fuera de alcance

- Selector para profesores.
- Recordar el año elegido entre sesiones.
- Cualquier cálculo de años, meses cobrables o deuda en el frontend: todo
  viene del backend (regla del `CLAUDE.md`).

## Preguntas abiertas

- Fase 4: ¿el selector se esconde o se desactiva en las pantallas que no
  dependen del año?

## Entrega para el siguiente chat

- Última acción terminada: **diseño y documentación**, 2026-09-29,
  ampliado el 2026-09-30 con el diálogo de materias, la fase 7 y los
  conceptos de pago por año. Nada implementado en este repo. Comprobado el
  2026-10-01: lo único con "año lectivo" en `src/` es el campo de texto del
  certificado de matrícula (`hooks/certificadosImpresion/`), que existe
  desde junio de 2026 y no es parte de esta funcionalidad.
- Siguiente acción de este repo: ninguna hasta que las fases 1 a 3 del
  backend estén en producción. Al 2026-10-01 el backend terminó la fase 1
  y escribió el código de su fase 2 (cobros por año), que todavía no está
  desplegado; lo siguiente allá es su fase 3. El contrato que dejó la fase
  2 para las pantallas de pagos y cartera está en la fase 5 de este
  documento. El estado al día está en la "Entrega" del documento del
  backend.
- Prompt para retomar: `docs/funcionalidades/PROMPT_CONTINUACION_ANIO_LECTIVO.md`.
