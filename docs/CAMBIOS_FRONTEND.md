# Cambios Frontend

Registro de documentacion del frontend.

## 2026-07-12 - Colores por dia en horario del profesor

Archivos modificados:

- `src/pages/DashboardProfesor.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- Las cards de clases dentro de `Horario asignado` ahora diferencian el dia con
  bordes, encabezado y hora en colores propios por dia.
- Se mantiene el morado institucional como color base del perfil profesor y se
  usan acentos suaves para facilitar la lectura del horario: lunes morado,
  martes esmeralda, miercoles ambar, jueves rosa y viernes slate.
- Se suavizo el fondo de cada dia y se reforzaron los bordes para diferenciar
  sin saturar visualmente la seccion.
- No se modificaron consultas, filtros, seleccion de clase ni datos del horario.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/pages/DashboardProfesor.jsx
pnpm run build
```

## 2026-07-12 - Perfil profesor con paleta visual del admin

Archivos modificados:

- `src/components/NavProfesor.jsx`
- `src/index.css`
- `src/pages/DashboardProfesor.jsx`
- `src/pages/Planilla.jsx`
- `src/pages/Asistencia.jsx`
- `src/pages/Formulario.jsx`
- `src/components/Observaciones.jsx`
- `src/pages/PlanDeClases.jsx`
- `src/pages/PlaneadorAnual.jsx`
- `src/pages/RankingRendimiento.jsx`
- `src/components/boletin/IngresoBoletinProfesor.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- Se alineo el color predominante del perfil profesor con el perfil admin,
  usando la misma familia morada para navegacion, estados activos, focos,
  encabezados, badges y botones principales.
- Se mantuvieron los colores semanticos existentes: rojo para alertas,
  verde para exito/guardado y amarillo para bajo rendimiento o pendientes.
- No se modificaron rutas, endpoints, payloads, permisos ni logica de guardado.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/components/NavProfesor.jsx src/pages/DashboardProfesor.jsx src/pages/Planilla.jsx src/pages/Asistencia.jsx src/pages/Formulario.jsx src/components/Observaciones.jsx src/pages/PlanDeClases.jsx src/pages/PlaneadorAnual.jsx src/pages/RankingRendimiento.jsx src/components/boletin/IngresoBoletinProfesor.jsx
pnpm run build
```

## 2026-07-12 - Validacion de asignacion antes de planilla y asistencia

Archivos modificados:

- `src/pages/Planilla.jsx`
- `src/pages/Asistencia.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- Planilla y Asistencia ahora validan que exista una asignacion seleccionada
  antes de cargar sus datos.
- Si el profesor entra sin seleccionar asignacion, se muestra el mismo aviso
  usado en Observaciones y se redirige a la pagina principal para escogerla.
- Se evita que el aviso se repita mas de una vez durante el mismo montaje de la
  pantalla.
- No se modificaron endpoints, payloads ni guardados existentes.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/pages/Planilla.jsx src/pages/Asistencia.jsx
```

## 2026-07-12 - Periodo recordado por profesor

Archivos modificados:

- `src/utils/periodoProfesor.js`
- `src/pages/DashboardProfesor.jsx`
- `src/pages/Planilla.jsx`
- `src/pages/Asistencia.jsx`
- `src/pages/Formulario.jsx`
- `src/pages/PlanDeClases.jsx`
- `src/pages/PlaneadorAnual.jsx`
- `src/pages/RankingRendimiento.jsx`
- `src/pages/RankingMejorRendimiento.jsx`
- `src/components/Observaciones.jsx`
- `src/components/boletin/IngresoBoletinProfesor.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/ESTADO_SESION.md`

Cambio:

- Se agrego `src/utils/periodoProfesor.js` para leer y guardar el periodo como
  preferencia local por docente (`periodo_profesor_<id>`).
- Las pantallas del perfil profesor leen el periodo recordado por profesor y
  usan `1` como respaldo.
- Al cambiar el selector de periodo, la pantalla guarda el valor por profesor y
  mantiene `localStorage.periodo` como compatibilidad para el flujo actual.
- El logout puede seguir limpiando `localStorage.periodo` sin borrar el ultimo
  periodo recordado de cada profesor en ese navegador.
- No se modificaron endpoints, payloads ni backend.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/utils/periodoProfesor.js src/pages/DashboardProfesor.jsx src/pages/Planilla.jsx src/pages/Asistencia.jsx src/pages/Formulario.jsx src/pages/PlanDeClases.jsx src/pages/PlaneadorAnual.jsx src/pages/RankingRendimiento.jsx src/pages/RankingMejorRendimiento.jsx src/components/Observaciones.jsx src/components/boletin/IngresoBoletinProfesor.jsx
```

## 2026-07-01 - Bloqueo de traduccion automatica del navegador

Se reforzo la aplicacion para evitar que Chrome, Edge u otros navegadores
traduzcan automaticamente nombres, cursos, materias, documentos y textos del
sistema.

Archivos modificados:

- `index.html`
- `src/App.jsx`
- `src/pages/Login.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- `index.html` ahora declara `lang="es"`, `translate="no"` y clase
  `notranslate` en `html`, `body` y `#root`.
- Se agrego `<meta name="google" content="notranslate">`.
- Los layouts principales y el login heredan `translate="no"` y
  `notranslate`.
- No se modificaron datos, endpoints ni logica de negocio.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/App.jsx src/pages/Login.jsx
```

## 2026-06-30 - Asignaciones sin curso por defecto

Se ajusto el asignador de clases del perfil admin para no seleccionar
automaticamente el primer curso al cargar.

Archivos modificados:

- `src/components/AsignarClase.jsx`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- `AsignarClase` inicia con el selector en `Seleccionar curso`.
- El panel de horario muestra el estado vacio hasta que el admin elige un curso.
- Al editar una asignacion existente, el formulario sigue seleccionando el curso
  real de esa asignacion.
- Esto evita que el encabezado o contexto visual diga que se trabaja sobre el
  primer curso disponible cuando el usuario aun no ha elegido curso.
- No se cambiaron endpoints, payloads ni backend.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/components/AsignarClase.jsx
```

## 2026-06-30 - Login sin codigo demo por defecto

Se ajusto el formulario de login para no precargar `demo` como codigo de
colegio.

Archivos modificados:

- `src/components/LoginForm.jsx`
- `docs/ESTADO_SESION.md`
- `docs/ROLES_UI.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- El campo `Codigo del colegio` inicia vacio cuando no existe un codigo real
  previo.
- Si existe `localStorage.ultimo_codigo_colegio`, se precarga ese ultimo codigo
  usado correctamente.
- El codigo se guarda solo despues de un login exitoso.
- Si por compatibilidad existe un valor viejo `demo`, se ignora y no se muestra
  como valor inicial.
- No se cambio duracion de sesion, cookies, token ni backend.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/components/LoginForm.jsx
```

## 2026-06-30 - Reporte academico parcial en certificados

Se agrego una pestaña de reporte academico parcial al modulo de Certificados
del perfil admin.

Archivos modificados:

- `src/pages/CertificadosAdmin.jsx`
- `docs/API_CLIENT.md`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- `CertificadosAdmin` agrega la pestaña `Reporte académico parcial`.
- El admin puede generar el reporte para un curso completo o para un estudiante
  individual.
- El reporte se filtra por periodo y por una materia especifica o todas las
  materias.
- El impreso muestra notas actuales, definitiva parcial, estado de la materia e
  inasistencias del periodo para las materias incluidas.
- Se reutilizan endpoints existentes: boletin admin para notas y asistencia por
  asignacion para inasistencias.
- No se agregaron endpoints ni se cambio el contrato backend.
- El impreso usa `DocumentoImprimible` para conservar branding, encabezado,
  firmas, comportamiento A4 y scroll lateral movil.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/pages/CertificadosAdmin.jsx
pnpm run lint
pnpm run build
```

Nota: el build local se relanzo con permisos elevados por el `EPERM` conocido
de Vite/fnm en esta maquina.

## 2026-06-24 - Orden configurable de materias en boletin

Se agrego una pantalla administrativa para ordenar las materias del boletin por
curso.

Archivos modificados:

- `src/components/OrdenBoletin.jsx`
- `src/pages/Admin.jsx`
- `src/components/boletin/Boletin.jsx`
- `docs/API_CLIENT.md`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- Administracion academica agrega la pestana `Orden boletin`.
- El admin selecciona un curso y reorganiza las materias con flechas o numero
  de posicion.
- La pantalla es responsive: en movil usa filas tactiles con controles de
  tamano fijo; en escritorio aprovecha el ancho disponible.
- El guardado consume `PUT /cursos/{curso_id}/orden-boletin`.
- El impreso de boletin consolida materias con `Map` para respetar el orden
  recibido del backend.

## 2026-06-23 - Mensajes de duplicados en administracion academica

Se ajustaron las pantallas de Profesores, Cursos y Materias para enviar nombres
en mayuscula y mostrar el mensaje real que devuelve el backend cuando un dato
esta duplicado.

Archivos modificados:

- `src/components/CrearProfesor.jsx`
- `src/components/CrearCurso.jsx`
- `src/components/CrearMateria.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- Profesores envia `nombre` y `apellido` en mayuscula.
- Cursos y materias envian `nombre` en mayuscula.
- Los errores `409 Conflict` del backend se muestran al usuario con el detalle
  especifico, por ejemplo documento, email, materia o curso repetido.

## 2026-06-23 - Codigo DANE en diseno de impresos

Se agrego el Codigo DANE como dato institucional configurable para cada
colegio desde Diseño de impresos.

Archivos modificados:

- `src/components/admin/IdentidadInstitucional.jsx`
- `src/components/impresion/DocumentoImprimible.jsx`
- `docs/API_CLIENT.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- El formulario de identidad institucional permite guardar `codigo_dane`.
- El encabezado comun `DocumentoImprimible` muestra `Codigo DANE` junto a los
  datos institucionales cuando el colegio lo tiene configurado.
- El cambio aplica a boletines, certificados, recibos, ventas, cartera,
  observaciones y planeadores que usan el sistema moderno de impresion.

Verificacion sugerida:

```powershell
pnpm exec eslint src/components/admin/IdentidadInstitucional.jsx src/components/impresion/DocumentoImprimible.jsx
```

## 2026-06-23 - Gestion de pagos usa deudas dedicadas

Se ajustaron Gestion de Pagos y el resumen del estudiante para cargar las
deudas academicas del estudiante desde un endpoint dedicado.

Archivos modificados:

- `src/pages/PagosAdmin.jsx`
- `src/pages/EstudiantesAdmin.jsx`
- `docs/API_CLIENT.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- `PagosAdmin` cambia de `GET /estudiantes/{id}/detalles` a
  `GET /estudiantes/{id}/deudas` para llenar el selector de conceptos
  pendientes.
- `EstudiantesAdmin` mantiene el resumen amplio de
  `GET /estudiantes/{id}/detalles`, pero fusiona las deudas desde
  `GET /estudiantes/{id}/deudas`.
- El detalle amplio del estudiante sigue disponible para el modulo de
  estudiantes, pero ya no bloquea la cobranza si falla una seccion no
  financiera.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/pages/PagosAdmin.jsx
pnpm exec eslint src/pages/EstudiantesAdmin.jsx
```

## 2026-06-20 - Titulo de observador profesor alineado

Se igualo el tamaño del titulo de `Observador del estudiante` en el perfil
profesor con los encabezados principales de las demas paginas docentes.

Archivo modificado:

- `src/pages/Formulario.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- El titulo pasa de `text-xl` a `text-2xl sm:text-3xl`.
- Se mantiene la logica de busqueda, listado y guardado del observador sin
  cambios.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-20 - Navbar admin y profesor mas compacto

Se ajustaron los navbars de administrador y profesor para que el bloque
superior se vea menos pesado y el nombre del software tenga mas presencia.

Archivos modificados:

- `src/components/NavAdmin.jsx`
- `src/components/NavProfesor.jsx`
- `src/index.css`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- Los encabezados admin y profesor reducen su padding vertical para que el
  cuadro superior se sienta mas compacto.
- La marca `Scholarix` aumenta de tamaño y queda alineada como una sola linea.
- El navbar profesor tambien muestra solo la marca en el encabezado, igual que
  admin.
- La capsula animada del nav desktop admin/profesor baja ligeramente su altura y
  padding, sin cambiar rutas, permisos, grupos ni comportamiento del menu.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-20 - Nav admin sin nombre de usuario bajo la marca

Se retiro el texto secundario `Admin: <nombre>` que aparecia debajo del nombre
del software en el navbar de administrador.

Archivos modificados:

- `src/components/NavAdmin.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- El navbar admin muestra solo la marca `Scholarix`.
- Se elimina el nombre del usuario debajo de la marca para limpiar el encabezado.
- No se cambia el boton de cerrar sesion, rutas, grupos ni permisos.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-20 - Nav con etiquetas mas legibles

Se aumento suavemente el tamaño de las palabras principales del navbar para
mejorar lectura sin cambiar la estructura de navegacion.

Archivos modificados:

- `src/index.css`
- `src/components/NavAdmin.jsx`
- `src/components/NavProfesor.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- Las pestañas principales del nav de escritorio pasan a `15px`.
- Los dropdowns aumentan altura tactil y texto a `15px`.
- En movil, las opciones principales usan `text-base` y las subopciones quedan
  en `15px`.

Alcance tecnico:

- Cambio visual de legibilidad.
- No cambia rutas, permisos, grupos, orden de pestañas ni comportamiento de
  despliegue.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-17 - Cumpleanos de estudiantes en dashboards

Se agrego un panel visual de cumpleaños de estudiantes en los dashboards de
admin y profesor.

Archivos modificados:

- `src/components/dashboard/CumpleanosSemana.jsx`
- `src/pages/AdminDashboard.jsx`
- `src/pages/DashboardProfesor.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- El dashboard admin muestra debajo de las cards un bloque `Cumpleaños de la
  semana` con los estudiantes activos que cumplen anos en los proximos 7 dias.
- El dashboard profesor muestra el mismo bloque con estudiantes de sus cursos
  asignados.
- El panel muestra nombre, curso, si cumple hoy/manana/en cuantos dias, edad
  cuando se puede calcular y estados de carga, error o lista vacia.
- Se consume el nuevo backend de dashboard para no cargar todos los estudiantes
  en el navegador.

Alcance tecnico:

- No se cambia navegacion, permisos visuales ni formularios.
- Requiere los endpoints backend:
  `/dashboard/cumpleanos/admin` y
  `/dashboard/cumpleanos/profesor/{profesor_id}`.
- Ambos se consumen con `dias=7`.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-17 - Saludo personalizado en dashboards admin y profesor

Se ajusto el saludo inicial de los dashboards principales para que sea mas
cercano y directo.

Archivos modificados:

- `src/pages/AdminDashboard.jsx`
- `src/pages/DashboardProfesor.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- El dashboard admin ya no muestra `Bienvenido`; ahora muestra `Hola` y el
  primer nombre del usuario admin en negrita.
- El dashboard profesor ya no muestra `Bienvenida/o`; ahora muestra `Hola` y
  el primer nombre del profesor en negrita.
- Cada dashboard muestra la frase corta con emoji al lado del nombre, como un
  mensaje de inicio.

Alcance tecnico:

- Cambio visual y de texto en frontend.
- No cambia rutas, permisos, carga de datos, endpoints ni backend.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-17 - Animacion de cards en dashboard admin

Se agrego una animacion visual suave solamente al dashboard principal de admin.

Archivos modificados:

- `src/pages/AdminDashboard.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- Las cards secundarias del dashboard admin ahora son accesos compactos con
  fondo tintado por modulo, franja lateral de color y una burbuja visual suave.
- Se organizan en una grilla mas densa en escritorio para evitar tarjetas
  demasiado grandes.
- En hover y foco de teclado elevan la tarjeta y refuerzan el color del modulo.
- La card destacada de cartera vuelve a conservar su estilo visual anterior.
- El icono de cada card mantiene una microinteraccion leve para dar sensacion
  de respuesta.
- Se agrego soporte para `prefers-reduced-motion` para usuarios que reduzcan
  animaciones del sistema.

Alcance tecnico:

- Cambio limitado a `/dashboard-admin`.
- No modifica dashboard profesor, rutas, permisos, endpoints ni contratos de
  backend.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-17 - Correccion de egresos en movimiento mensual

Se corrigio la consulta de egresos desde `Movimiento mensual` en
`ReportesAdmin`.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- El detalle mensual de egresos ya no arma el rango con `YYYY-MM-31`.
- Ahora calcula el ultimo dia real del mes antes de llamar
  `/reportes/egresos-rango`.
- El rango activo de ingresos mensuales tambien conserva la fecha final real
  del mes.

Motivo:

- En meses sin dia 31, como febrero, abril, junio, septiembre o noviembre, el
  rango podia quedar invalido y el panel hacia scroll pero no mostraba egresos.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-17 - Reportes sin accesos rapidos redundantes

Se simplifico el encabezado de `ReportesAdmin` retirando los botones `Ver
ingresos` y `Ver egresos` que estaban junto a `Actualizar`.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- El encabezado conserva solo el boton `Actualizar`.
- Los botones `Ingresos` y `Egresos` del panel `Rango de fechas` se mantienen
  como accion principal para consultar movimientos del rango seleccionado.
- No se cambio la carga de detalle, filtros, cards financieros ni endpoints.

Alcance tecnico:

- Cambio visual en frontend.
- No cambia backend, permisos, payload ni base de datos.

## 2026-06-17 - Retiro temporal de apoyos laterales en Plan de Clases

Se retiraron los bloques laterales de `Plantillas rápidas` e `Ideas para
enriquecer` del perfil profesor para evitar ayudas genericas poco claras
mientras se diseña un flujo mas util basado en Malla Curricular.

Archivos modificados:

- `src/pages/PlanDeClases.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`
- `docs/PLAN_EJECUCION_FRONTEND.md`

Cambio:

- Se eliminaron las plantillas rapidas y su accion de autorrelleno local.
- Se elimino el panel `Ideas para enriquecer`.
- El formulario principal de guia didactica y evidencias ocupa todo el ancho
  disponible.
- Se mantiene el flujo de `Usar como base` desde planes recientes.
- Se documento como trabajo futuro conectar Plan de Clases con la Malla
  Curricular para sugerir temas por asignacion, periodo, consecutivo y fecha.

Alcance tecnico:

- No cambia endpoints, permisos, payload ni base de datos.
- El retiro es solo visual/funcional en frontend.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-17 - Detalle visual de planeaciones recibidas admin

Se mejoro la lectura del plan seleccionado en `PlaneadoresClasesAdmin` para
que el cuerpo enviado por el profesor se vea como un reporte academico mas
claro y dinamico.

Archivo modificado:

- `src/pages/PlaneadoresClasesAdmin.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- El detalle del plan ahora muestra encabezado de `Reporte recibido` con tema,
  profesor y chips de materia, curso, periodo y fecha.
- Se agregaron bloques visuales para fundamentos pedagogicos: unidad, logro,
  estandar y desarrollo cognitivo.
- La ruta de clase queda destacada en una seccion propia para mejorar lectura
  de textos largos.
- Actividad en clase y actividad en casa se muestran como bloques separados.
- Las evidencias se mantienen al final del reporte con la misma logica de
  visualizacion y borrado.
- Se quito el scroll interno del panel de detalle; el scroll propio queda solo
  en la lista de `Envíos recibidos`.
- En escritorio, la lista de envios conserva ancho lateral y su area de scroll
  se estira con la altura del detalle para evitar un panel cortado.
- La lista mantiene scroll interno y la carga inicial sigue limitada a 20
  envios; el historico completo se trae solo al usar `Cargar más planeaciones`.

Alcance tecnico:

- No cambia endpoints, permisos, payload ni base de datos.
- El cambio es solo UI del detalle admin de planeaciones recibidas.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-17 - Planeadores admin paginados y taller docente profesor

Se ajustaron las pantallas de plan de clases para que el perfil admin revise
envios de profesores con una bandeja paginada y para que el perfil profesor
tenga un entorno mas guiado al elaborar sus planes.

Archivos modificados:

- `src/pages/PlaneadoresClasesAdmin.jsx`
- `src/pages/PlanDeClases.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- `PlaneadoresClasesAdmin` consume `GET /admin/plan-de-clases` con
  `limit=20` y `offset`, conserva los filtros actuales y agrega boton
  `Cargar más planeaciones`.
- La vista admin muestra resumen de `Total`, `Mostrados` y `Con evidencia`,
  lista de envios mas escaneable y detalle amplio sin scroll interno.
- `PlanDeClases` mantiene el mismo contrato de guardado, los mismos campos y
  el mismo envio multipart a `/plan-de-clases`.
- La vista profesor se reorganizo como taller docente con contexto de clase,
  guia didactica y opcion `Usar como base` desde planes recientes.

Alcance tecnico:

- No se crearon tablas.
- No se agregaron migraciones.
- No se cambio el payload enviado al backend.
- El endpoint admin ya soporta `limit`, `offset` y respuesta `{ total, items }`;
  el frontend conserva fallback si recibe una lista simple.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Lint sin errores.
- Build de produccion OK.

## 2026-06-13 - Navbar animado de escritorio para admin y profesor

Se agrego un navbar animado reutilizable para escritorio, inspirado en el
modelo visual de borde/indicador sobre la pestaña activa.

Archivos modificados/agregados:

- `src/components/DesktopAnimatedNav.jsx`
- `src/components/NavAdmin.jsx`
- `src/components/NavProfesor.jsx`
- `src/index.css`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- `NavAdmin` y `NavProfesor` usan el nuevo componente solo desde breakpoint
  `lg`.
- Los menus moviles se mantienen con el comportamiento colapsable existente.
- El indicador se calcula segun el elemento activo o en hover, por lo que no
  depende de `nth-child` ni de una cantidad fija de pestañas.
- Se conserva `translate="no"` para `Nómina`.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

## 2026-06-13 - Organizacion de documentacion frontend SaaS

Se reorganizo y actualizo la documentacion del frontend para mejorar el control
operativo del SaaS.

Archivos modificados/agregados:

- `docs/README.md`
- `docs/API_CLIENT.md`
- `docs/ARQUITECTURA_FRONTEND.md`
- `docs/CHECKLIST_PRODUCCION_FRONTEND.md`
- `docs/COMPONENTES.md`
- `docs/DEPLOY_GRATIS.md`
- `docs/ESTADO_SESION.md`
- `docs/PLAN_EJECUCION_FRONTEND.md`
- `docs/PRODUCCION_FRONTEND.md`
- `docs/ROLES_UI.md`
- `docs/RUTAS_FRONTEND.md`

Cambios:

- Se agrego un indice principal para saber que documento usar segun el tema.
- Se documentaron los modulos recientes del perfil profesor: planilla movil,
  asistencia, observador e ingreso de boletin.
- Se agregaron criterios de Android/Chrome para `translate="no"` y ocultamiento
  de etiquetas tecnicas como `mas_alto`.
- Se actualizo la documentacion de produccion con UX movil profesor/admin,
  riesgos de cookies, Render/Neon y verificaciones post deploy.
- Se actualizaron rutas, roles, sesion, arquitectura y checklist para reflejar
  el estado actual del SaaS.

Verificacion ejecutada:

```powershell
rg -n "2026-06-13|Planilla|Asistencia|Observaciones|IngresoBoletin|translate=\"no\"|mas_alto" docs
```

## 2026-06-12 - Verificacion del observador en movil

Se ajusto el estado inicial del Observador del estudiante para evitar que el
badge quede indefinidamente en `Verificando` cuando la consulta de registro
tarda o se queda colgada en movil.

Archivo modificado:

- `src/components/Observaciones.jsx`

Cambio:

- La consulta inicial de observacion usa cancelacion con tiempo limite.
- Si la consulta falla o se cancela, el componente apaga `cargando` y vuelve a
  estado `Pendiente` en vez de quedarse en `Verificando`.
- Se evita actualizar estado si el componente se desmonta durante la consulta.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-12 - Etiqueta Nomina en nav admin movil

Se corrigio la etiqueta `Nómina` del menu de cartera en `NavAdmin` para evitar
que Chrome Android la traduzca como `nombre`.

Archivo modificado:

- `src/components/NavAdmin.jsx`

Cambio:

- La opcion `Nómina` queda marcada con `translate="no"` en desktop y movil.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-12 - Etiquetas de notas en ingreso de boletin

Se aplico al ingreso de boletin final el mismo criterio usado en planilla para
evitar etiquetas tecnicas o traducidas por el navegador.

Archivo modificado:

- `src/components/boletin/IngresoBoletinProfesor.jsx`

Cambios:

- Se oculta la nota tecnica `mas_alto` en el detalle de notas de referencia.
- Los nombres de tipo de nota se formatean como etiquetas humanas, reemplazando
  guiones bajos o medios por espacios.
- Las etiquetas visibles de notas usan `translate="no"` para reducir
  traducciones automaticas del navegador.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-12 - Historial y estado guardado en asistencia profesor

Se mejoro la pantalla de asistencia del perfil profesor para que el historial
de inasistencias sea mas claro cuando tarda en cargar y para mostrar si la
asistencia del dia ya fue registrada.

Archivos modificados:

- `src/pages/Asistencia.jsx`
- `src/components/AsistenciaRow.jsx`

Cambios:

- La carga del historial ahora tiene estado visible: `Cargando historial de
  inasistencias...`.
- Si la consulta del historial falla, se muestra un mensaje de error con boton
  `Reintentar`.
- La consulta del historial hace un reintento corto antes de mostrar error,
  para reducir fallos intermitentes de produccion.
- El historial se normaliza en un mapa por estudiante para evitar busquedas
  repetidas al renderizar la lista.
- Si el historial trae registros para la fecha seleccionada, la pantalla muestra
  la notificacion `Asistencia del día ya tomada`.
- Cuando ya existe asistencia para la fecha, los botones de presente/ausente se
  precargan con el estado guardado y el boton principal cambia a
  `Actualizar Asistencia`.
- Mientras el historial esta cargando, cada fila muestra `Cargando historial...`
  en vez de un contador `0` que podria confundirse con dato real.

Alcance:

- No se cambiaron endpoints ni payloads enviados al backend.
- La mejora es de estado visual, manejo de errores y eficiencia del render.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

## 2026-06-12 - UX movil en planilla de notas del profesor

Se mejoro la experiencia movil de la planilla de notas del perfil profesor
para que agregar o editar calificaciones sea mas comodo desde celular.

Archivos modificados:

- `src/pages/Planilla.jsx`
- `src/components/PlanillaRow.jsx`
- `src/constants/valoracionesDesarrollo.js`

Cambios:

- En movil, la tabla de notas se reemplaza por tarjetas por estudiante.
- Cada tarjeta muestra primero el nombre del estudiante y luego las notas por
  tipo de evaluacion, evitando que el nombre ocupe demasiado espacio lateral.
- En calificacion numerica, cada tipo de nota usa un input tactil de ancho
  completo.
- En desarrollo infantil, las opciones se muestran como botones con emoji y
  nombre visible: `Destacado`, `Logrado`, `En proceso` y `Requiere apoyo`.
- En escritorio se conserva la tabla tradicional con columnas, encabezados y
  promedio fijo.
- En la tarjeta movil, el promedio se muestra verde cuando es mayor o igual a
  `3.0` y rojo cuando esta por debajo de `3.0`.
- En la tabla de escritorio, el promedio usa el mismo color: verde desde `3.0`
  y rojo por debajo de `3.0`.
- Despues de guardar una nota numerica, el promedio de la tarjeta movil se
  recalcula localmente para no depender de recargar la pagina.
- La actualizacion del promedio movil se aplica de forma optimista antes de la
  recarga del backend y se reaplica despues de sincronizar, evitando que Android
  conserve visualmente el promedio anterior.
- Las notas numericas aceptan coma decimal de teclado movil y se normalizan a
  punto antes de enviar al backend.
- Los controles superiores de la planilla ajustan padding, tamaño de titulo y
  botones para pantallas estrechas.

Alcance:

- No se cambiaron endpoints ni estructura de datos enviada al backend.
- La mejora aplica al render responsive del frontend.
- Se mantiene la proteccion contra traduccion automatica en nombres, tipos de
  nota e inputs.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

## 2026-06-11 - Optimizacion inicial de carga del dashboard profesor

Se mejoro el tiempo percibido de aparicion del dashboard del perfil profesor
sin cambiar endpoints ni reglas de negocio.

Archivo modificado:

- `src/pages/DashboardProfesor.jsx`

Cambios:

- Se elimino la doble llamada a `GET /mis-clases/{profesor_id}`. La misma
  respuesta ahora alimenta tanto la lista de clases como el horario asignado.
- Se reemplazo el `loading` global de pantalla completa por estados de carga
  por seccion:
  - clases/horario;
  - inasistencias;
  - rendimiento bajo/alto.
- El dashboard puede pintar su estructura principal aunque una tarjeta siga
  cargando datos.
- Las consultas de `notas-bajas` y `notas-altas` se agruparon en una sola
  funcion y se ejecutan en paralelo cuando hay curso seleccionado.

Alcance:

- No se agregaron endpoints.
- No se cambiaron filtros, calculos, rutas ni permisos.
- Si el backend esta dormido en hosting gratuito, la primera respuesta puede
  seguir tardando, pero la UI ya no queda bloqueada por todas las peticiones.

Verificacion ejecutada:

```powershell
rg -n "mis-clases|loadingClases|loadingInasistencias|loadingRendimiento" src/pages/DashboardProfesor.jsx
pnpm run lint
pnpm run build
```

Resultado:

- `GET /mis-clases/{profesor_id}` queda referenciado una sola vez en
  `DashboardProfesor.jsx`.
- Lint OK.
- Build de produccion OK al ejecutarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.

## 2026-06-11 - Ajustes UX movil en admin, impresos y observador

Se mejoro la experiencia movil del perfil admin sin cambiar endpoints, calculos
ni reglas de negocio.

Archivos modificados:

- `src/components/NavAdmin.jsx`
- `src/components/admin/PlantillasAdmin.jsx`
- `src/components/boletin/Boletin.jsx`
- `src/components/impresion/DocumentoImprimible.jsx`
- `src/pages/BrandingAdmin.jsx`
- `src/pages/CarteraVencidaAdmin.jsx`
- `src/pages/CertificadosAdmin.jsx`
- `src/pages/EstudiantesAdmin.jsx`
- `src/styles/print.css`

Cambios:

- `NavAdmin` en movil ya no despliega todas las subsecciones al abrir el menu.
  Las secciones agrupadas se abren bajo demanda, y sus subpestanas tienen
  estilos diferenciados frente a las pestañas principales.
- La administracion de diseno de impresos y plantillas se ajusto para pantallas
  estrechas: tabs con desplazamiento horizontal, controles apilados y boton de
  guardado mas usable en movil.
- `DocumentoImprimible` acepta `className` por documento y aplica una clase de
  root para documentos que necesitan scroll lateral en movil.
- El toolbar de impresos ahora usa botones compactos `Descargar PDF` e
  `Imprimir`. Ambos abren el dialogo nativo de impresion/guardar PDF del
  navegador.
- Boletin, certificados y estados de cuenta de cartera conservan ancho A4 en
  movil y se desplazan horizontalmente para evitar que el documento salga
  mocho o comprimido.
- El boton `Atras` de boletin y certificados queda arriba a la izquierda para
  no chocar con la barra inferior de descarga/impresion en celulares.
- En `/admin/estudiantes`, el observador dentro del modal de detalle se
  reorganizo para movil: encabezado apilado, contador de registros, chips para
  periodo/materia/profesor/fecha y tarjetas separadas para conductual,
  cognitivo y lenguaje.

Alcance:

- El scroll lateral A4 aplica solo a documentos marcados como boletin,
  certificado o cartera.
- Los cambios mas fuertes de documento estan dentro de media queries moviles.
- En escritorio se conserva la vista centrada y amplia de documentos; el cambio
  visible principal es la posicion superior del boton `Atras` en boletin y
  certificados, y una presentacion mas ordenada del observador.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Lint OK.
- Build de produccion OK al ejecutarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.

## 2026-06-10 - Limpieza de header de tenant en frontend

Se removio el envio del header `X-Tenant-ID` desde el cliente.

Archivos modificados:

- `src/utils/api.js`
- `src/components/LoginForm.jsx`

Cambio:

- El frontend ya no lee `tenant` desde `localStorage` para enviarlo como header.
- El login ya no guarda `tenant` como clave separada en `localStorage`.
- La fuente de verdad del tenant sigue siendo la cookie/token emitida por el
  backend.
- El objeto de sesion (`usuario`, `profesor` o `super_admin`) conserva el tenant
  solo como dato informativo de sesion.

Verificacion ejecutada:

```powershell
rg -n "X-Tenant-ID|setItem\\(['\\\"]tenant['\\\"]|getItem\\(['\\\"]tenant['\\\"]" src
pnpm run lint
pnpm run build
```

Resultado:

- No quedan lecturas/escrituras separadas de `tenant` para el header.
- Lint OK.
- Build de produccion OK.

## 2026-06-10 - Limpieza controlada de warnings de hooks

Se limpiaron los warnings pendientes de `react-hooks/exhaustive-deps` sin
cambiar endpoints, rutas, permisos ni reglas de negocio.

Archivos modificados:

- `src/components/admin/PlantillasAdmin.jsx`
- `src/components/boletin/IngresoBoletinProfesor.jsx`
- `src/components/impresion/DocumentoImprimible.jsx`
- `src/pages/Asistencia.jsx`
- `src/pages/DashboardProfesor.jsx`
- `src/pages/PlanDeClases.jsx`
- `src/pages/PlaneadoresClasesAdmin.jsx`
- `src/pages/Planilla.jsx`
- `src/pages/RankingRendimiento.jsx`

Cambio:

- Se estabilizaron funciones usadas por `useEffect` con `useCallback`.
- Se declararon dependencias reales en los hooks para evitar estados antiguos en
  memoria.
- Se memoizo la configuracion de impresos para evitar recalculos innecesarios.
- En `PlaneadoresClasesAdmin`, el filtro de profesor y fechas conserva recarga
  automatica, mientras que el campo de busqueda sigue ejecutandose solo al
  presionar `Buscar`.
- Este cambio deja cerrada la nota previa de warnings pendientes en lint.

Pruebas manuales recomendadas:

- Entrar con perfil profesor y revisar `Dashboard`.
- Revisar `Asistencia`, `Planilla`, `Plan de Clases`, `Malla Curricular` y
  `Boletin final`.
- Entrar con perfil admin y revisar `Diseño de impresos / Plantillas`.
- Revisar `Planeadores de clases`, cambiando profesor, fechas y usando el boton
  `Buscar`.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Lint OK, sin errores y sin warnings.
- Build de produccion OK al ejecutarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.

## 2026-06-10 - Estado de guardado en plan de clases y malla curricular

Se agrego identificador visual de guardado en los modulos del perfil profesor:
Plan de clases y Malla curricular.

Archivos modificados:

- `src/pages/PlanDeClases.jsx`
- `src/pages/PlaneadorAnual.jsx`

Cambio:

- Ambos modulos muestran estado `Verificando`, `Pendiente`, `Guardado` o
  `Cambios sin guardar`.
- Plan de clases marca `Guardado` cuando existe plan para la fecha seleccionada.
- Malla curricular marca `Guardado` cuando el periodo trae planeadores
  registrados desde el backend.
- Al editar campos, fechas o imagenes pendientes de subir, el estado cambia a
  `Cambios sin guardar`.
- Luego de guardar correctamente, vuelve a `Guardado` y muestra hora de
  actualizacion.
- Los botones cambian texto segun el estado, siguiendo el criterio visual usado
  en boletin final y observador.

Pruebas manuales recomendadas:

- Entrar con perfil profesor.
- Abrir `Plan de Clases`, seleccionar fecha con y sin plan guardado y confirmar
  el estado.
- Editar un campo o cargar imagen y confirmar `Cambios sin guardar`.
- Guardar y confirmar que vuelve a `Guardado`.
- Abrir `Malla Curricular`, cambiar de periodo y confirmar si aparece
  `Guardado` o `Pendiente`.
- Editar una celda o fecha, guardar y confirmar que vuelve a `Guardado`.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 12 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Estado de guardado en observador del estudiante

Se agrego identificador visual de guardado en el Observador del estudiante del
perfil profesor.

Archivos modificados:

- `src/components/Observaciones.jsx`

Cambio:

- Cada observador muestra un badge con estado `Pendiente`, `Guardado`,
  `Cambios sin guardar` o `Verificando`.
- Al cargar una observacion existente completa, el estado queda como
  `Guardado`.
- Al editar cualquier dimension, el estado cambia a `Cambios sin guardar`.
- Luego de guardar correctamente, vuelve a `Guardado` y muestra la hora de
  actualizacion.
- Se replica el criterio visual usado en el ingreso de boletin final.

Pruebas manuales recomendadas:

- Entrar con perfil profesor.
- Abrir `Observaciones`.
- Confirmar que estudiantes sin observador muestran `Pendiente`.
- Confirmar que estudiantes con observador ya guardado muestran `Guardado`.
- Editar un campo y confirmar que cambia a `Cambios sin guardar`.
- Guardar y confirmar que vuelve a `Guardado`.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 12 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Refactor de medios de pago en reportes

Se separo la logica de medios de pago del componente principal de Reportes y
Estadisticas.

Archivos modificados:

- `src/pages/ReportesAdmin.jsx`
- `src/utils/reportesMediosPago.js`

Cambio:

- Se extrajeron helpers de normalizacion, filtro, detalle visible y calculo de
  montos por medio de pago.
- `ReportesAdmin.jsx` queda enfocado en carga de datos, estados y renderizado.
- El comportamiento visual y funcional del detalle de ingresos se mantiene igual.
- El archivo principal bajo a 609 lineas; la logica extraida queda aislada en
  `reportesMediosPago.js`.

Pruebas manuales recomendadas:

- Abrir `Reportes y Estadisticas`.
- Abrir `Detalle de ingresos`.
- Filtrar por `Efectivo`, `Transferencia` y `Tarjeta`.
- Confirmar que los detalles como `Transferencia - daviplata` y los montos se
  sigan mostrando igual.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Etiqueta base en transferencias con detalle

Se ajusto la etiqueta visible del medio de pago cuando una transferencia trae
detalle libre.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- Cuando el metodo interno es `transferencia` y existe detalle, el chip usa
  `Transferencia` como etiqueta base.
- Evita duplicados como `Daviplata - daviplata`.
- Un pago con detalle `daviplata` ahora debe verse como
  `Transferencia - daviplata`.

Pruebas manuales recomendadas:

- Abrir `Detalle de ingresos`.
- Revisar una transferencia con detalle `daviplata`.
- Confirmar que el chip muestre `Transferencia - daviplata`.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Correccion de extraccion de detalle por guion

Se corrigio la lectura del detalle libre del medio de pago cuando el backend
envia valores como `transferencia - texto`.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- La extraccion del detalle ya no usa la normalizacion que reemplaza guiones por
  espacios.
- Valores como `transferencia - sapo` ahora conservan el texto posterior al
  guion y se muestran como `Transferencia - sapo`.
- Tambien se mantiene soporte para `transferencia: texto`.

Pruebas manuales recomendadas:

- Abrir `Detalle de ingresos`.
- Confirmar que un pago con `tipo_pago` guardado como `transferencia - texto`
  se vea en el chip como `Transferencia - texto`.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Conserva descripcion libre en tipo de pago

Se corrigio el detalle visible del medio de pago cuando el backend envia el
texto libre dentro de `tipo_pago`.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- Si el backend envia valores como `transferencia - sapo`, el reporte extrae y
  muestra el texto libre despues del separador.
- La clasificacion interna sigue siendo `transferencia`, para que el filtro
  funcione igual.
- La etiqueta visible queda como `Transferencia - sapo` en vez de reducirse a
  solo `Transferencia`.
- Tambien se soporta el formato con dos puntos, por ejemplo
  `transferencia: sapo`.

Pruebas manuales recomendadas:

- Registrar un pago por transferencia con una nota libre.
- Abrir `Detalle de ingresos`.
- Filtrar por `Transferencia`.
- Confirmar que se vea `Transferencia - texto libre`.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Detalle libre en transferencia

Se ajusto el detalle visible del medio de pago en Reportes y Estadisticas para
respetar el texto escrito por el usuario.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- En transferencias, el texto escrito en `nota` o campos equivalentes se muestra
  como detalle visible.
- El sistema ya no limita ese detalle a bancos o plataformas conocidas.
- Si el usuario escribe un texto libre como `sapo`, el detalle puede mostrarse
  como `Transferencia - sapo`.
- Se amplio la lectura de campos como `nota_pago`, `nota_metodo`,
  `observacion`, `observaciones`, `referencia`, `detalle`,
  `detalle_pago` y `descripcion_metodo`.

Pruebas manuales recomendadas:

- Registrar un pago por transferencia con una nota libre.
- Abrir `Detalle de ingresos`.
- Confirmar que el chip del medio de pago muestre `Transferencia - texto`.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Correccion de monto en ingresos filtrados

Se corrigio el monto mostrado en `Detalle de ingresos` cuando se filtra por
`Transferencia` o `Tarjeta`.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- La columna `Monto` ya no depende solo de `pago.monto`; ahora usa como respaldo
  `monto_valido`, `valor`, `total`, `monto_pagado`, `valor_pagado`, `abono` y
  campos equivalentes.
- Si el backend no entrega el monto parcial separado del metodo, pero el ingreso
  pertenece al metodo filtrado, se muestra el monto total del ingreso en vez de
  quedar en `0`.
- Los chips de medio de pago tambien muestran el monto al estar dentro de un
  filtro seleccionado.
- Se ajusto la lectura de valores con separador colombiano, por ejemplo
  `10.000`, para que se interpreten como diez mil y no como diez.
- Los pagos anulados siguen sin sumar en los totales del detalle filtrado.

Pruebas manuales recomendadas:

- Abrir `Detalle de ingresos`.
- Filtrar por `Transferencia` y confirmar que la columna `Monto` muestra valor.
- Filtrar por `Tarjeta` y confirmar que la columna `Monto` muestra valor.
- Confirmar que el total superior cambia segun el filtro y no suma anulados.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Detalle visible y monto por medio de pago

Se ajusto el detalle de ingresos en Reportes y Estadisticas para conservar la
informacion especifica del metodo de pago al filtrar.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- El filtro sigue usando categorias internas (`efectivo`, `transferencia`,
  `tarjeta`), pero la tabla conserva la etiqueta visible real del pago.
- Las transferencias pueden mostrarse como `Nequi`, `Daviplata`, `PSE`,
  `Bancolombia` o `Transferencia - banco/app` si el backend entrega ese dato.
- Se amplio la lectura de montos parciales por metodo para campos como
  `monto_transferencia`, `valor_transferencia`, `monto_nequi`,
  `valor_daviplata`, `monto_tarjeta`, `valor_tarjeta`, entre otros.
- Al filtrar por un solo metodo, la columna `Monto` muestra el valor parcial de
  ese metodo cuando esta disponible.

Pruebas manuales recomendadas:

- Abrir `Detalle de ingresos`.
- Filtrar por `Transferencia` y confirmar que se vea `Nequi`, `Daviplata` o el
  banco correspondiente.
- Confirmar que el monto mostrado sea el valor de la transferencia cuando el
  pago tenga montos separados.
- Filtrar por `Tarjeta` y confirmar que el monto parcial tambien se conserve.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Correccion de filtro por transferencia y tarjeta

Se amplio la normalizacion del filtro de medio de pago en Reportes y
Estadisticas.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- El filtro ya no depende de coincidencias exactas como `transferencia` o
  `tarjeta`.
- Se reconocen variantes como `transferencia bancaria`, `PSE`, `Nequi`,
  `Daviplata`, `Bancolombia`, `tarjeta debito`, `tarjeta credito`, `datafono`,
  `POS` y `targeta`.
- Se aceptan metodos enviados como arreglo, arreglo de textos, objeto, JSON
  serializado o texto.
- Si un texto contiene varios medios de pago, el ingreso aparece en cada filtro
  correspondiente.

Pruebas manuales recomendadas:

- Abrir `Detalle de ingresos`.
- Filtrar por `Transferencia` y confirmar que aparecen pagos transferidos.
- Filtrar por `Tarjeta` y confirmar que aparecen pagos de tarjeta/datáfono.
- Confirmar que `Efectivo` sigue funcionando.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Filtro por medio de pago en detalle de ingresos

Se agrego filtro por medio de pago en el detalle de ingresos del modulo
Reportes y Estadisticas.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- El panel `Detalle de ingresos` ahora incluye un selector para filtrar por
  `Todos`, `Efectivo`, `Transferencia` o `Tarjeta`.
- El filtro se aplica localmente sobre los ingresos ya cargados para no cambiar
  endpoints ni calculos del backend.
- El total superior se recalcula segun el medio de pago seleccionado.
- En pagos mixtos con montos por metodo, el total filtrado suma solo el monto
  del metodo seleccionado.
- Las filas anuladas conservan el monto visible tachado, pero no suman como
  ingreso valido.

Pruebas manuales recomendadas:

- Ir a Admin > Reportes y Estadisticas.
- Abrir `Detalle de ingresos`.
- Cambiar el filtro entre `Efectivo`, `Transferencia` y `Tarjeta`.
- Confirmar que la tabla y el total cambian segun el filtro.
- Probar un pago mixto y confirmar que el filtro muestra el metodo correcto.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Medio de pago en detalle de ingresos

Se agrego el medio de pago en el detalle de ingresos del modulo Reportes y
Estadisticas.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- La tabla `Detalle de ingresos` ahora muestra una columna `Medio de pago`.
- Se normalizan los valores `efectivo`, `transferencia` y `tarjeta`.
- Tambien se acepta `targeta` como equivalente de `tarjeta` por compatibilidad.
- Si el backend entrega pago mixto en una lista de metodos, se muestran los
  metodos y sus montos.
- Se soportan varios nombres posibles de campo: `tipo_pago`, `metodo_pago`,
  `medio_pago`, `forma_pago`, `metodos`, `metodos_pago`, `medios_pago`,
  `formas_pago` y `detalle_metodos`.

Pruebas manuales recomendadas:

- Ir a Admin > Reportes y Estadisticas.
- Abrir `Detalle de ingresos` por el dia o por rango.
- Confirmar que cada ingreso muestra `Efectivo`, `Transferencia` o `Tarjeta`.
- Probar un pago mixto y confirmar que se ven varios metodos.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Ajuste de resumen en certificados imprimibles

Se ajustaron los impresos de certificados para evitar repetir el nombre del
estudiante en el bloque superior de datos.

Archivo modificado:

- `src/pages/CertificadosAdmin.jsx`

Cambio:

- En `Certificado de notas` se quito el campo `Estudiante` del resumen superior.
- En `Certificado de matrícula` se quito el campo `Estudiante` del resumen
  superior.
- El nombre del estudiante se conserva dentro del texto formal del certificado.

Pruebas manuales recomendadas:

- Generar un certificado de notas y confirmar que el resumen inicia en
  `Documento`.
- Generar un certificado de matrícula y confirmar que el resumen inicia en
  `Documento`.
- Confirmar que el nombre del estudiante sigue apareciendo en el cuerpo del
  certificado.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Certificado de matricula en modulo de certificados

Se agrego la separacion por pestanas dentro del modulo de certificados para
soportar certificado de notas y certificado de matricula.

Archivo modificado:

- `src/pages/CertificadosAdmin.jsx`

Cambio:

- Se agregaron pestanas internas: `Certificado de notas` y
  `Certificado de matrícula`.
- La pestana de notas conserva el flujo existente de periodo individual o todos
  los periodos.
- La pestana de matricula reemplaza el selector de periodo por el campo
  `Año lectivo`.
- El certificado de matricula reutiliza `DocumentoImprimible` y el branding
  institucional.
- El impreso de matricula muestra estudiante, documento, curso, jornada, estado
  y año lectivo.
- El texto del certificado queda orientado a soportes administrativos,
  pensiones, subsidios u otros tramites externos.
- No se agregaron rutas nuevas ni cambios en navbar; ambos certificados viven
  dentro de `/admin/certificados`.

Pruebas manuales recomendadas:

- Ir a Admin > Gestion Academica > Certificados.
- Confirmar que inicia en `Certificado de notas` y genera como antes.
- Cambiar a `Certificado de matrícula`.
- Ajustar el año lectivo, seleccionar un estudiante y generar el certificado.
- Presionar `Imprimir` y validar encabezado, datos del estudiante y firmas.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Historial de prestamos bajo seleccion de trabajador

Se ajusto la pantalla de prestamos para que el historial no se cargue
automaticamente al abrir el modulo.

Archivo modificado:

- `src/pages/PrestamosAdmin.jsx`

Cambio:

- Al abrir la pagina solo se carga la lista de profesores/trabajadores.
- El historial de prestamos se consulta unicamente cuando se selecciona un
  profesor o trabajador en el filtro.
- El selector del historial carga automaticamente los prestamos del trabajador
  seleccionado.
- El boton `Limpiar` vacia el historial y vuelve al mensaje inicial.
- Se agrego un mensaje visible indicando que el historial se carga al escoger
  un profesor o trabajador.
- Despues de registrar un prestamo, el historial se muestra filtrado por el
  trabajador al que se le creo el prestamo.

Pruebas manuales recomendadas:

- Abrir Admin > Nomina/Prestamos y confirmar que no aparece historial cargado.
- Confirmar que se muestra el aviso para seleccionar profesor o trabajador.
- Seleccionar un trabajador y validar que se cargue su historial.
- Presionar `Limpiar` y confirmar que el historial desaparece.
- Crear un prestamo y confirmar que queda visible filtrado por ese trabajador.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-06 - Impresion de estado de cuenta por estudiante y curso

Se agrego impresion de estado de cuenta desde el modulo de Cartera, usando solo
la informacion de cuotas vencidas que ya carga esa pantalla.

Archivo modificado:

- `src/pages/CarteraVencidaAdmin.jsx`

Cambio:

- Se agrego un boton `Imprimir` por estudiante en la tabla.
- Se agrego un boton `Imprimir curso`, habilitado cuando hay un curso
  seleccionado y registros visibles.
- El impreso usa `DocumentoImprimible` para mantener encabezado, branding,
  margenes y boton de impresion unificado.
- El reporte se presenta como `Estado de cuenta`.
- El alcance visible del documento queda como `Cuotas vencidas`.
- El reporte individual del estudiante conserva fecha de corte, totales, deuda
  academica, inventario, mora, cuotas vencidas, conceptos academicos y
  ventas/cargos pendientes.
- El reporte de curso imprime una tabla compacta con estudiante y valor general
  adeudado.
- Al final del reporte de curso se muestran los totales de deuda academica,
  deuda de inventario y total general.
- El reporte de curso respeta los estudiantes visibles dentro del curso y los
  filtros activos de la pantalla.
- No se agregaron endpoints ni se modificaron calculos financieros; el impreso
  reutiliza la data actual de `/cartera/mora`.

Pruebas manuales recomendadas:

- Ir a Admin > Cartera > Cartera vencida.
- Presionar `Imprimir` en un estudiante y validar el detalle.
- Seleccionar un curso y presionar `Imprimir curso`.
- Confirmar que `Volver` regresa a la tabla.
- En la vista imprimible, presionar `Imprimir` y revisar que el documento
  conserve encabezado, totales y tablas.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-05 - Documento visible en generar boletines

Se corrigio la columna `Documento` en la pantalla administrativa para generar
boletines.

Archivo modificado:

- `src/components/boletin/Boletin.jsx`

Cambio:

- Se agrego una funcion `documentoEstudiante` para leer el documento desde los
  nombres de campo usados por distintas respuestas del backend:
  `documento_identidad`, `documento`, `identificacion` o `cedula`.
- La tabla de estudiantes ahora muestra el documento aunque el endpoint no lo
  entregue como `documento_identidad`.
- La busqueda tambien incluye el documento normalizado.
- Se ajusto el placeholder de busqueda para indicar `documento` en lugar de
  `ID`.

Pruebas manuales recomendadas:

- Ir a Admin > Gestion Academica > Gestion Boletines.
- Confirmar que la columna `Documento` muestra el numero del estudiante.
- Buscar por documento y confirmar que el estudiante aparece.
- Generar un boletin para confirmar que el flujo no cambia.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-05-25

Se creo/actualizo la carpeta `docs/` del frontend con documentacion del estado actual del proyecto.

Archivos documentados:

- `ARQUITECTURA_FRONTEND.md`
- `RUTAS_FRONTEND.md`
- `COMPONENTES.md`
- `ROLES_UI.md`
- `API_CLIENT.md`
- `ESTADO_SESION.md`
- `PRODUCCION_FRONTEND.md`
- `CAMBIOS_FRONTEND.md`

Alcance:

- Estructura de `src/`.
- Rutas actuales de React.
- Paginas existentes.
- Componentes principales.
- Consumo de API con Axios.
- Manejo de token.
- Manejo de roles en UI.
- Guards y rutas protegidas.
- Variables `.env` del frontend.
- Build con Vite.
- Riesgos pendientes observados.
- Preparacion actual para produccion.

No se modifico logica de la aplicacion.
No se modificaron componentes, paginas, servicios ni rutas.

## 2026-05-26

Se actualizo `src/pages/PlaneadorAnual.jsx`.

Cambio:

- Se agrego validacion antes de guardar el planeador anual.
- Si una fila tiene contenido escrito pero no tiene fecha seleccionada, el guardado se detiene.
- Se muestra un mensaje indicando la fila que necesita fecha.

Motivo:

- Evitar guardar planeadores con contenido academico sin fecha estimada.

Archivo modificado:

- `src/pages/PlaneadorAnual.jsx`

Pruebas manuales recomendadas:

- Escribir contenido en una fila y dejar la fecha vacia.
- Presionar `Guardar Planeador`.
- Confirmar que aparece el mensaje de fecha obligatoria.
- Seleccionar fecha y volver a guardar.
- Confirmar que el guardado funciona.

Verificacion:

- Se intento ejecutar `pnpm run build`, pero fallo por permisos locales `EPERM` en `AppData`.
- Se intento ejecutar Vite directo, pero fallo por `spawn EPERM` al cargar configuracion.
- El fallo observado corresponde al entorno local de PowerShell/pnpm/Vite, no a una validacion de negocio del codigo.

## 2026-05-26 - Logout contra backend

Se actualizaron los navbars de admin y profesor para cerrar sesion contra el backend.

Archivos modificados:

- `src/components/NavAdmin.jsx`
- `src/components/NavProfesor.jsx`

Cambio:

- `handleLogout` ahora llama `POST /logout` usando el cliente `api`.
- Luego limpia `localStorage` y redirige a `/login`.
- Se conserva la limpieza anterior de `document.cookie` como compatibilidad para cookies no HttpOnly.

Motivo:

- El backend crea la cookie `token` como HttpOnly.
- Una cookie HttpOnly no puede ser eliminada por JavaScript.
- El logout correcto debe pedirle al backend que elimine la cookie.

Pruebas manuales recomendadas:

- Iniciar sesion como profesor.
- Confirmar que existe cookie `token`.
- Cerrar sesion desde el menu.
- Confirmar que la cookie `token` desaparece.
- Repetir el mismo flujo como admin.

Verificacion:

- Se intento ejecutar `pnpm run build`, pero fallo por permisos locales `EPERM` en `AppData`.
- Se verifico que ambos navbars importan `api` y llaman `api.post("/logout")`.

## 2026-05-26 - Token fuera de localStorage

Se endurecio el manejo de sesion del frontend para que el JWT no quede guardado en `localStorage`.

Archivos modificados:

- `src/components/LoginForm.jsx`
- `src/utils/api.js`

Cambio:

- `LoginForm` ya no guarda toda la respuesta del login en `localStorage`.
- Ahora solo guarda datos minimos de UI: `id`, `nombre`, `rol` y `tenant`.
- `api.js` ya no usa `access_token` guardado en `localStorage` como respaldo.
- Las peticiones siguen usando `withCredentials: true`, por lo que la cookie de sesion enviada por el backend viaja automaticamente.
- `Cookies.get("token")` queda solo como compatibilidad para cookies no HttpOnly usadas en desarrollo.

Motivo:

- Reducir el riesgo de robo de JWT por XSS.
- Mantener el token real en cookie HttpOnly manejada por el backend.
- Separar datos de UI de credenciales sensibles.

Pruebas manuales recomendadas:

- Cerrar sesion y volver a iniciar sesion como admin.
- Revisar DevTools > Application > Local Storage.
- Confirmar que `usuario` no contiene `access_token` ni `token_type`.
- Confirmar que existe la cookie `token`.
- Navegar por pantallas admin y confirmar que las llamadas API funcionan.
- Cerrar sesion y confirmar que la cookie `token` desaparece.
- Repetir el flujo como profesor y confirmar que `profesor` no contiene `access_token` ni `token_type`.

Verificacion:

- Se revisaron `src/components/LoginForm.jsx` y `src/utils/api.js`.
- Se intento buscar usos restantes de `access_token`/`token_type`, pero PowerShell mostro ruido local de permisos de `fnm`; no se observaron coincidencias funcionales en los archivos modificados.
- La compilacion con `pnpm run build` sigue bloqueada por permisos locales `EPERM` en `AppData`.

## 2026-05-26 - Crear Curso sin campos financieros

Se actualizo el formulario administrativo de crear/editar cursos para separar lo academico de lo financiero.

Archivo modificado:

- `src/components/CrearCurso.jsx`

Cambio:

- Se ocultaron/eliminaron del formulario los inputs:
  - `Matricula`;
  - `Mensualidad`;
  - `Meses`.
- El formulario ahora muestra datos academicos del curso:
  - `Nombre`;
  - `Jornada`.
- El payload ya no envia `matricula`, `mensualidad` ni `meses`.

Motivo:

- Los cobros se administran desde `Tipos de Pago`.
- Evitar que el admin configure valores financieros duplicados entre Crear Curso y Cartera.
- Alinear el formulario con el backend, donde Curso ya quedo como entidad academica.

Pruebas manuales recomendadas:

- Crear un curso nuevo desde Administracion > Crear Curso.
- Confirmar que solo pide nombre y jornada.
- Editar un curso existente y confirmar que no aparecen campos financieros.
- Ir a Tipos de Pago y asignar los cobros al curso.
- Confirmar que cartera/pagos calculan deuda desde Tipos de Pago.

Verificacion:

- Se reviso `src/components/CrearCurso.jsx`.
- No quedan estados, inputs ni payload de `matricula`, `mensualidad` o `meses`.

## 2026-05-26 - Nomina usa sueldo del profesor como salario base

Se ajusto el modal de pago de nomina para que el campo `Salario Base` se llene
automaticamente con el sueldo asignado al profesor.

Archivo modificado:

- `src/pages/NominaAdmin.jsx`

Cambio:

- Al abrir el modal `Realizar Pago`, `salarioBase` ya no queda vacio.
- Ahora toma `empleado.sueldo` recibido desde `/api/nomina/empleados`.
- Si el empleado no trae sueldo, usa `0` como valor seguro.

Motivo:

- Evitar que el admin tenga que volver a digitar manualmente el sueldo que ya se
  configuro al crear o editar el profesor.

Pruebas manuales recomendadas:

- Crear o editar un profesor con sueldo.
- Ir a Admin > Cartera > Gestion de Nomina.
- Abrir `Realizar Pago` para ese profesor.
- Confirmar que `Salario Base` muestra el sueldo asignado.
- Confirmar que el total neto se recalcula correctamente con bonos/descuentos.

## 2026-05-26 - Alerta clara para tipos de pago duplicados

Se ajusto la pantalla de Tipos de Pago para mostrar la causa real cuando el
backend rechaza un concepto duplicado.

Archivo modificado:

- `src/components/cartera/AdministrarTiposPago.jsx`

Cambio:

- En el guardado de conceptos, el `catch` ahora lee `error.response.data.detail`.
- Si el backend responde `409`, muestra una alerta de `Concepto duplicado`.
- Para otros errores, muestra el detalle del backend o un mensaje generico mas
  especifico.

Motivo:

- Evitar que el usuario vea "Error de conexion" cuando en realidad el concepto
  ya existe.

Pruebas manuales recomendadas:

- Ir a Admin > Cartera > Tipos de Pago.
- Intentar crear un concepto con un nombre existente.
- Confirmar que la alerta diga que el concepto ya existe.
- Intentar editar un concepto usando el nombre de otro existente.

## 2026-05-26 - Normalizacion visual al crear profesor, curso y materia

Se agrego normalizacion en frontend para enviar nombres en formato titulo desde
el panel administrativo.

Archivos modificados:

- `src/components/CrearProfesor.jsx`
- `src/components/CrearCurso.jsx`
- `src/components/CrearMateria.jsx`

Cambio:

- Profesor:
  - `nombre` y `apellido` se envian con iniciales en mayuscula;
  - `email` se envia en minusculas.
- Curso:
  - `nombre` se envia con iniciales en mayuscula.
- Materia:
  - `nombre` se envia con iniciales en mayuscula.

Motivo:

- Mejorar consistencia visual en listados, boletines, reportes e impresos.
- Evitar guardar textos con mayusculas/minusculas desordenadas desde la UI.

Pruebas manuales recomendadas:

- Crear profesor escribiendo `juan carlos` y `perez`.
- Confirmar que se guarda/lista como `Juan Carlos Perez`.
- Crear curso y materia en minusculas.
- Confirmar que aparecen con iniciales en mayuscula.

## 2026-05-27 - Anular pagos desde historial del estudiante

Se agrego la accion de anulacion de pagos desde el historial de pagos del
estudiante y se ajusto el reporte de ingresos para mostrar la huella de pagos
anulados.

Archivos modificados:

- `src/pages/PagosAdmin.jsx`
- `src/pages/ReportesAdmin.jsx`

Cambio:

- En el historial de pagos del estudiante aparece `Anular pago` para pagos
  vigentes.
- Al anular, se pide motivo obligatorio.
- Los pagos anulados quedan visibles, marcados como `Anulado` y con el monto
  tachado.
- No se permite imprimir recibo de un pago anulado.
- En Reportes > Ingresos Mensuales/rango:
  - se muestran `Total valido` y `Total anulado`;
  - las filas anuladas se ven en rojo;
  - el motivo de anulacion aparece en el detalle.

Motivo:

- Evitar eliminacion fisica de pagos.
- Mantener trazabilidad financiera antes de implementar una pagina general de
  movimientos/auditoria.

Pruebas manuales recomendadas:

- Registrar un pago.
- Anularlo desde el historial con motivo.
- Confirmar que aparece en rojo como anulado.
- Abrir ingresos mensuales y confirmar que aparece como huella, pero no suma al
  total valido.

## 2026-05-27 - Anular ventas de inventario

Se agrego accion de anulacion en el listado de cargos recientes de ventas de
inventario.

Archivo modificado:

- `src/pages/VentasAdmin.jsx`

Cambio:

- Cada venta vigente muestra accion `Anular`.
- La anulacion pide motivo obligatorio.
- Una venta anulada queda marcada en rojo como `Anulada`.
- El motivo de anulacion se muestra debajo del detalle del cargo.
- El total aparece tachado cuando la venta esta anulada.

Motivo:

- Evitar eliminacion de ventas y conservar trazabilidad visual.
- Alinear ventas de inventario con la anulacion auditada de pagos.

Pruebas manuales recomendadas:

- Crear una venta/cargo de inventario.
- Anularla desde cargos recientes escribiendo motivo.
- Confirmar que queda marcada como `Anulada`.
- Confirmar que al recargar la pantalla se mantiene anulada.

## 2026-05-28 - Dashboard profesor: rankings por curso

Se ajustaron los cards del dashboard del profesor para mostrar informacion mas
util y filtrable sin depender solo del primer resultado.

Archivo modificado:

- `src/pages/DashboardProfesor.jsx`

Cambio:

- El card de inasistencias ahora muestra ranking por curso.
- Los cards de notas bajas y notas altas muestran listados, no solo un
  estudiante.
- Se agrego filtro por `Curso` y `Materia` para notas bajas y notas altas.
- Los botones de ranking detallado quedaron separados del card para evitar
  navegaciones accidentales.

Seguridad:

- El filtro por curso se envia al backend como `curso_id`.
- La autorizacion real queda en backend; la UI no decide permisos.

Pruebas manuales recomendadas:

- Entrar como profesor y revisar el dashboard.
- Cambiar el filtro entre `Todas las materias del curso` y una materia especifica.
- Confirmar que notas bajas/altas cambian segun el filtro.
- Confirmar que inasistencias muestra ranking por curso.
- Confirmar que el boton `Ver ranking por materia` sigue pidiendo seleccionar
  un salon/materia.

Correccion posterior:

- El filtro de rendimiento quedo en dos niveles:
  - `Curso`.
  - `Materia`: `Todas las materias del curso` o una materia especifica.
- `Todas las materias del curso` calcula el rendimiento usando solo las
  materias que ese profesor dicta en el curso seleccionado.

## 2026-05-30 - Aviso de tenant en mora

Se agrego un aviso global para tenants con estado `en_mora`.

Archivos modificados/agregados:

- `src/components/TenantStatusBanner.jsx`
- `src/App.jsx`

Cambio:

- El layout autenticado consulta `GET /tenant/status`.
- Si el backend responde `mostrar_aviso = true`, se muestra un banner superior
  indicando que el servicio esta en mora.
- Si el tenant esta `activo`, no se muestra ningun aviso.
- El aviso se renderiza una sola vez en el layout para admin y profesor.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Reportes dinamicos con card de egresos

Se rediseño la pantalla de reportes y estadisticas para mostrar indicadores
financieros mas claros y permitir detalle clickeable de egresos.

Archivos modificados:

- `src/pages/ReportesAdmin.jsx`
- `docs/API_CLIENT.md`

Cambio:

- Se agregaron cards de ingresos hoy, egresos hoy, balance hoy y balance
  general.
- El card de egresos es clickeable y carga el detalle desde
  `GET /reportes/egresos-rango`.
- Al cargar un detalle desde una card o boton de reportes, la pantalla baja
  automaticamente al panel de detalle.
- Se agrego comparacion mensual de ingresos, egresos y balance con barras
  visuales.
- El panel de detalle ahora alterna entre ingresos y egresos.
- Se mantuvo la busqueda por rango de fechas para ingresos y egresos.
- La pantalla usa un layout mas denso, moderno y orientado a lectura rapida.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Administracion como pestaña principal

Se ajusto la navegacion del admin para mejorar acceso a la pantalla de
administracion academica.

Archivos modificados:

- `src/components/NavAdmin.jsx`

Cambio:

- Se saco `Administracion` del dropdown `Gestion Academica`.
- Se agrego `Administracion` como pestaña principal junto a `Estudiantes`.
- El mismo ajuste se aplico al menu movil.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Certificados en Gestion Academica

Se agrego una pantalla administrativa para generar certificados de notas usando
el sistema de impresion existente.

Archivos modificados/agregados:

- `src/pages/CertificadosAdmin.jsx`
- `src/App.jsx`
- `src/components/NavAdmin.jsx`
- `docs/API_CLIENT.md`
- `docs/RUTAS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- Se agrego la ruta `/admin/certificados`.
- Se agrego `Certificados` dentro del menu `Gestion Academica`.
- La pantalla permite filtrar estudiantes por curso, estado, busqueda y periodo.
- Se agrego opcion `Todos los periodos`, que consulta P1 a P4 y presenta notas
  por periodo con promedio.
- El certificado toma nombre completo y documento desde la ficha del estudiante
  para evitar datos incompletos si el consolidado academico no los devuelve.
- Si una materia no trae definitiva directa, o recibe `0`, la pantalla calcula
  una nota de respaldo desde `detalles.notas_por_periodo` o `detalles.nota`,
  usando solo valores mayores que `0`.
- Al generar, consume `GET /boletines/admin/generar/{estudiante_id}/{periodo}`.
- El certificado se imprime con `DocumentoImprimible`, reutilizando el branding,
  encabezado, firmas y pie de pagina del diseno de impresos.

Pruebas manuales recomendadas:

- Entrar como admin.
- Ir a `Gestion Academica > Certificados`.
- Filtrar un curso, seleccionar periodo y generar certificado de un estudiante.
- Confirmar que aparece el certificado con tabla de materias, notas y desempeno.
- Presionar `Imprimir` y validar encabezado, datos institucionales y firmas.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Prestamos sin eliminar y filtro por profesor

Se ajusto la pantalla de prestamos para conservar trazabilidad financiera y
facilitar la revision por profesor.

Archivos modificados:

- `src/pages/PrestamosAdmin.jsx`
- `docs/API_CLIENT.md`

Cambio:

- Antes de registrar, el formulario valida profesor y monto mayor que 0.
- Antes de enviar al backend, muestra confirmacion con profesor, monto, fecha y
  aviso de que el prestamo no se puede eliminar; solo saldar.
- Se quito la accion `Eliminar`.
- Los prestamos pendientes solo muestran accion `Saldar`.
- Los prestamos pagados muestran estado saldado sin accion operativa.
- El historial permite filtrar por profesor usando
  `GET /api/prestamos/?profesor_id={profesor_id}`.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-01 - Cierre fase SaaS super admin

Se agregaron ajustes frontend para cerrar la primera fase de control SaaS.

Archivos modificados/agregados:

- `src/App.jsx`
- `src/components/LoginForm.jsx`
- `src/pages/CambiarPassword.jsx`
- `src/pages/SuperAdminDashboard.jsx`
- `docs/API_CLIENT.md`
- `docs/PRODUCCION_FRONTEND.md`
- `docs/RUTAS_FRONTEND.md`
- `docs/CHECKLIST_PRODUCCION_FRONTEND.md`

Cambio:

- Si login responde `debe_cambiar_password = true`, el admin entra a
  `/cambiar-password`.
- Las rutas normales de admin redirigen a `/cambiar-password` hasta completar
  el cambio.
- `CambiarPassword` llama `POST /auth/cambiar-password` y actualiza
  `localStorage.usuario`.
- Crear colegio valida email y password temporal fuerte desde frontend.
- El panel de super admin muestra `estado` efectivo y, cuando difiere,
  `estado_manual`.

Verificacion ejecutada:

```powershell
pnpm run build
```

Resultado:

- Build de produccion OK.

## 2026-06-01 - Crear colegio desde super admin

Se agrego el formulario frontend para crear colegios desde el panel de
plataforma.

Archivos modificados:

- `src/pages/SuperAdminDashboard.jsx`
- `docs/API_CLIENT.md`
- `docs/PRODUCCION_FRONTEND.md`
- `docs/CHECKLIST_PRODUCCION_FRONTEND.md`
- `docs/PLAN_EJECUCION_FRONTEND.md`

Cambio:

- Se agrego boton `Crear colegio`.
- El formulario pide colegio, codigo, admin inicial, password temporal, fecha
  de inicio, proximo pago, dias de gracia y notas.
- Al crear correctamente, el colegio aparece en la tabla de tenants.
- La tabla muestra proximo pago y dias de gracia.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-01 - Confirmacion, motivo e historial de estado SaaS

Se fortalecio el panel de super admin para que los cambios de estado tengan
motivo y puedan revisarse.

Archivos modificados:

- `src/pages/SuperAdminDashboard.jsx`
- `docs/API_CLIENT.md`
- `docs/PRODUCCION_FRONTEND.md`
- `docs/CHECKLIST_PRODUCCION_FRONTEND.md`
- `docs/PLAN_EJECUCION_FRONTEND.md`

Cambio:

- Antes de cambiar estado se pide confirmacion.
- Para `suspendido` y `cancelado` el motivo es obligatorio.
- El motivo se envia al backend junto con el estado.
- Se agrego boton `Ver` para consultar historial de cambios por tenant.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-01 - Mensaje de login para tenant bloqueado

Se ajusto el formulario de login para no mostrar "Credenciales incorrectas"
cuando el colegio existe pero esta suspendido o cancelado.

Archivo modificado:

- `src/components/LoginForm.jsx`

Cambio:

- `401`: muestra credenciales incorrectas.
- `403`: muestra "Servicio no disponible" y el mensaje enviado por backend.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-05-30 - Panel inicial de super admin

Se agrego la primera pantalla de plataforma para controlar tenants.

Archivos modificados/agregados:

- `src/components/NavSuperAdmin.jsx`
- `src/pages/SuperAdminDashboard.jsx`
- `src/App.jsx`
- `src/components/LoginForm.jsx`
- `src/utils/api.js`
- `src/components/NavAdmin.jsx`
- `src/components/NavProfesor.jsx`
- `docs/API_CLIENT.md`
- `docs/COMPONENTES.md`
- `docs/PRODUCCION_FRONTEND.md`
- `docs/ROLES_UI.md`
- `docs/RUTAS_FRONTEND.md`

Cambio:

- El mismo login soporta `rol = "super_admin"`.
- El super admin se guarda en `localStorage.super_admin`.
- Se agrego ruta `/super-admin`.
- El panel lista tenants y permite cambiar estado entre `activo`, `en_mora`,
  `suspendido` y `cancelado`.
- Logout y manejo global de `401` limpian tambien `localStorage.super_admin`.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Estados de estudiantes y profesores

Se agrego control operativo por estado para estudiantes y profesores desde las
pantallas administrativas, alineado con el backend y sin borrado fisico.

Archivos modificados:

- `src/pages/EstudiantesAdmin.jsx`
- `src/components/CrearProfesor.jsx`
- `docs/API_CLIENT.md`
- `docs/PRODUCCION_FRONTEND.md`

Cambio:

- Estudiantes muestran `activo` por defecto.
- La pantalla de estudiantes permite filtrar `activo`, `retirado`, `egresado`,
  `inactivo` y `todos`.
- Se agrego cambio de estado de estudiante via
  `PATCH /estudiantes/{estudiante_id}/estado`.
- Profesores muestran `activo` por defecto.
- La pantalla de profesores permite filtrar `activo`, `inactivo` y `todos`.
- Se agrego cambio de estado de profesor via
  `PATCH /profesores/{profesor_id}/estado`.
- El formulario de profesor permite crear/editar conservando estado.
- La UI muestra etiquetas de estado y trata la desactivacion como operativa, no
  como eliminacion de historial.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Estado operativo de cursos

Se agrego control operativo por estado para cursos desde la pantalla
administrativa, alineado con el backend y sin borrado fisico.

Archivos modificados:

- `src/components/CrearCurso.jsx`
- `docs/API_CLIENT.md`
- `docs/PRODUCCION_FRONTEND.md`

Cambio:

- Cursos muestran `activo` por defecto.
- La pantalla de cursos permite filtrar `activo`, `inactivo` y `todos`.
- Se agrego campo de estado al crear/editar curso.
- Se agrego cambio de estado de curso via `PATCH /cursos/{curso_id}/estado`.
- La UI muestra etiquetas de estado y trata la desactivacion como operativa, no
  como eliminacion de historial.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Estado operativo de materias

Se agrego control operativo por estado para materias desde la pantalla
administrativa, alineado con el backend y sin borrado fisico.

Archivos modificados:

- `src/components/CrearMateria.jsx`
- `docs/API_CLIENT.md`
- `docs/PRODUCCION_FRONTEND.md`

Cambio:

- Materias muestran `activo` por defecto.
- La pantalla de materias permite filtrar `activo`, `inactivo` y `todos`.
- Se agrego campo de estado al crear/editar materia.
- Se agrego cambio de estado de materia via
  `PATCH /materias/{materia_id}/estado`.
- La UI muestra etiquetas de estado y trata la desactivacion como operativa, no
  como eliminacion de historial.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Estado operativo de productos de inventario

Se agrego control operativo por estado para productos de inventario, alineado
con el backend y sin borrado fisico.

Archivos modificados:

- `src/pages/InventarioAdmin.jsx`
- `src/pages/VentasAdmin.jsx`
- `docs/API_CLIENT.md`
- `docs/PRODUCCION_FRONTEND.md`

Cambio:

- Productos muestran `activo` por defecto en inventario.
- La pantalla de inventario permite filtrar `activo`, `inactivo` y `todos`.
- Se agrego campo de estado al crear/editar producto.
- Se agrego cambio de estado de producto via
  `PATCH /inventario/{item_id}/estado`.
- La accion de eliminar en UI se reemplazo por desactivar para conservar
  historial de ventas.
- Ventas solo carga productos activos con stock.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Egresos filtrados por fecha y sin eliminar

Se ajusto la pantalla de egresos para mostrar por defecto solo los egresos del
dia actual y buscar por rango de fechas.

Archivos modificados:

- `src/pages/EgresosAdmin.jsx`
- `docs/API_CLIENT.md`

Cambio:

- El historial inicia filtrado por la fecha actual.
- Se agregaron campos `Desde` y `Hasta`.
- Se agrego boton `Buscar` para consultar el rango seleccionado.
- Se agrego boton `Hoy` para volver rapidamente al dia actual.
- Se quito la columna/accion `Eliminar`.
- Antes de registrar, el formulario valida concepto, categoria y monto mayor
  que 0.
- Antes de enviar al backend, muestra una confirmacion con concepto, monto,
  fecha y categoria.
- Si el backend rechaza el egreso, la alerta muestra el detalle de validacion
  recibido.
- Se agrego accion `Editar` solo para egresos manuales devueltos con
  `editable = true`.
- Al editar, se reutiliza el formulario, se pide confirmacion y se llama
  `PUT /api/egresos/{egreso_id}`.
- Los egresos automaticos, como nomina, se muestran sin accion editable.
- Al registrar un egreso, el listado se actualiza para la fecha del egreso
  registrado.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-05 - Correccion de historial de egresos por fechas

Se corrigio la carga del historial en Control de Egresos y Gastos.

Archivo modificado:

- `src/pages/EgresosAdmin.jsx`

Cambio:

- El boton `Buscar` ahora envia correctamente `fecha_desde` y `fecha_hasta`
  seleccionadas por el usuario.
- La fecha por defecto ya no usa UTC; ahora se calcula con la fecha local del
  navegador.
- El boton `Hoy` tambien usa la fecha local.
- La respuesta de egresos se normaliza a lista para evitar fallos si el backend
  devuelve un formato inesperado.
- El total y el monto de la tabla convierten `monto` a numero antes de formatear.

Pruebas manuales recomendadas:

- Ir a Admin > Cartera > Egresos.
- Confirmar que al entrar se muestran los egresos del dia local.
- Elegir un rango con egresos anteriores y presionar `Buscar`.
- Confirmar que el historial cambia al rango seleccionado.
- Presionar `Hoy` y confirmar que vuelve al dia actual.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Tipos de pago sin eliminar concepto

Se ajusto la pantalla de Tipos de Pago para que los conceptos de cobro no se
eliminen desde acciones.

Archivos modificados:

- `src/components/cartera/AdministrarTiposPago.jsx`
- `docs/API_CLIENT.md`

Cambio:

- Se quito el boton de eliminar concepto en la tabla de conceptos existentes.
- Se elimino la llamada frontend `DELETE /tipos-pagos/{id}` desde esa pantalla.
- El flujo operativo queda en crear, editar, configurar y cambiar estado
  `activo/inactivo`.
- La conservacion del concepto protege trazabilidad de cartera, pagos y reportes
  financieros.

Pruebas manuales recomendadas:

- Ir a Admin > Cartera > Tipos de Pago.
- Confirmar que en `Conceptos Existentes` solo aparecen acciones de configurar
  y editar.
- Desactivar un concepto desde su configuracion y confirmar que queda como
  inactivo/borrador.
- Confirmar que los conceptos historicos siguen visibles al listar.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-05 - Alineacion de acciones en listado de profesores

Se ajusto el listado de profesores dentro de Administracion academica para que
la columna de acciones quede ubicada de forma consistente despues de ampliar el
layout global.

Archivo modificado:

- `src/components/CrearProfesor.jsx`

Cambio:

- La tabla de profesores ahora usa `table-fixed` y un ancho minimo controlado.
- Las columnas `Nombre`, `Email`, `Estado` y `Acciones` tienen anchos definidos.
- La columna `Acciones` queda alineada a la derecha.
- Los controles de estado y editar no hacen wrap en pantallas amplias.
- Nombre y email usan truncado con `title` para evitar que textos largos
  deformen la tabla.

Pruebas manuales recomendadas:

- Ir a Admin > Administracion > Profesores.
- Confirmar que la columna `Acciones` queda al extremo derecho del listado.
- Probar con profesores de nombres/emails largos.
- Revisar que en pantallas angostas la tabla mantenga scroll horizontal.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-05 - Ancho de generar boletines administrativos

Se ajusto la pantalla administrativa de generacion de boletines para que use el
ancho ampliado del layout global.

Archivo modificado:

- `src/components/boletin/Boletin.jsx`

Cambio:

- La vista de busqueda/listado para generar boletines dejo de usar
  `max-w-6xl mx-auto`.
- El listado de estudiantes y los filtros ahora pueden ocupar el ancho global
  disponible.
- No se modifico la vista del boletin generado ni `DocumentoImprimible`, para
  conservar el formato profesional de impresion.

Pruebas manuales recomendadas:

- Ir a Admin > Gestion Academica > Gestion Boletines.
- Confirmar que la pantalla de busqueda/listado aprovecha mas ancho.
- Generar un boletin y confirmar que la vista imprimible conserva su formato.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-05 - Revision de paginas amplias y asistencia profesor

Se revisaron las paginas operativas principales despues de ampliar el layout
global para detectar limites internos que seguian dejando pantallas pequeñas.

Archivos modificados:

- `src/pages/Asistencia.jsx`
- `src/components/AsistenciaRow.jsx`
- `src/pages/TiposPagosAdmin.jsx`

Cambio:

- `Asistencia.jsx` dejo de usar `max-w-4xl`, por lo que ahora aprovecha el
  ancho del layout global.
- `AsistenciaRow.jsx` se ajusto para verse mejor en ancho amplio y en movil:
  nombre truncado, contador de inasistencias y botones estables.
- `TiposPagosAdmin.jsx` dejo de limitar el modulo de conceptos a `max-w-4xl`.
- Estudiantes, Pagos, Reportes, Administracion e Inventario no tenian un
  `max-w` interno fuerte que bloqueara el nuevo ancho global.

Pruebas manuales recomendadas:

- Entrar como profesor y abrir Asistencia.
- Confirmar que la pagina ya no queda angosta y que las filas se ven ordenadas.
- Entrar como admin y revisar Tipos de Pago.
- Revisar Estudiantes, Pagos, Reportes, Administracion e Inventario para
  confirmar que el ancho global se aprovecha sin desordenar la UI.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-05 - Alineacion de navbars al ancho global

Se ajustaron las barras superiores y el banner SaaS para que coincidan con el
nuevo ancho global de la aplicacion.

Archivos modificados:

- `src/components/NavAdmin.jsx`
- `src/components/NavProfesor.jsx`
- `src/components/NavSuperAdmin.jsx`
- `src/components/TenantStatusBanner.jsx`

Cambio:

- Los contenedores internos pasaron de `max-w-6xl` a `max-w-[1600px]`.
- Se agrego `w-full` y el mismo padding responsive usado por el `main` global.
- Los menus moviles conservan el mismo ancho/padding para quedar alineados.
- No se cambiaron rutas, permisos ni logica de navegacion.

Pruebas manuales recomendadas:

- Iniciar sesion como admin y confirmar que navbar, banner y contenido quedan
  alineados.
- Repetir el flujo como profesor.
- Revisar super admin en `/super-admin`.
- Probar el menu movil en una pantalla angosta.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-05 - Ampliacion inicial del ancho global

Se ajusto el contenedor principal de la aplicacion para aprovechar mejor
pantallas grandes sin eliminar limites internos de paginas especificas.

Archivo modificado:

- `src/App.jsx`

Cambio:

- El `main` global paso de `max-w-6xl` a `max-w-[1600px]`.
- Se mantiene `mx-auto`, `w-full` y padding responsive.
- El cambio aplica al layout general y al layout de super admin.
- No se tocaron navbars ni paginas internas en este primer paso.

Pruebas manuales recomendadas:

- Abrir pantallas grandes como Estudiantes, Pagos, Reportes, Inventario y
  Administracion.
- Confirmar si el contenido gana ancho sin sentirse desordenado.
- Revisar una pantalla pequena para confirmar que el padding responsive se
  mantiene correcto.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-05 - Administracion admin con tabs superiores

Se rediseño la pagina `Admin.jsx` para eliminar el sidebar y dar todo el ancho
al contenido de los modulos academicos del perfil admin.

Archivo modificado:

- `src/pages/Admin.jsx`

Cambio:

- Se elimino el sidebar de la pagina de administracion academica.
- Se agregaron tabs superiores compactas para `Profesores`, `Cursos`,
  `Materias` y `Asignaciones`.
- El modulo `Profesores` queda cargado por defecto.
- El contenido del modulo usa el ancho completo disponible.
- En movil y tablet las tabs se desplazan horizontalmente.
- Se elimino la pantalla inicial de seleccion para evitar redundancia.
- Se conserva la carga lazy: cursos, materias y asignaciones se cargan solo
  cuando el usuario abre su tab.

Pruebas manuales recomendadas:

- Ir a Admin > Administracion.
- Confirmar que `Profesores` carga por defecto.
- Abrir Profesores, Cursos, Materias y Asignaciones.
- Confirmar que no aparece sidebar ni pantalla inicial de seleccion.
- Probar en una pantalla angosta y confirmar que el menu se desplaza
  horizontalmente.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Filtro operativo de tipos de pago por estado

Se mejoro la experiencia de Tipos de Pago para separar los conceptos activos de
los inactivos.

Archivos modificados:

- `src/components/cartera/AdministrarTiposPago.jsx`
- `src/pages/PagosAdmin.jsx`
- `docs/API_CLIENT.md`

Cambio:

- La tabla de conceptos muestra por defecto solo los activos.
- Se agrego filtro `Activos`, `Inactivos` y `Todos` con contador.
- Los conceptos inactivos se muestran atenuados cuando se consultan desde
  `Inactivos` o `Todos`.
- Al desactivar un concepto se confirma que no generara nuevos cobros y que las
  deudas/pagos existentes se conservan.
- Al reactivar un concepto se confirma que vuelve con su configuracion anterior
  sin generar cobros retroactivos automaticamente.
- `PagosAdmin` solo conserva conceptos activos como apoyo para nuevos pagos.
- Las deudas ya generadas siguen visibles y cobrables aunque su concepto haya
  sido desactivado.

Pruebas manuales recomendadas:

- Ir a Admin > Cartera > Tipos de Pago y confirmar que inicia en `Activos`.
- Desactivar un concepto y confirmar que sale del filtro `Activos`.
- Cambiar a `Inactivos` y confirmar que aparece atenuado.
- Reactivar el concepto y confirmar el aviso de no retroactividad.
- En Pagos, confirmar que las deudas pendientes del estudiante siguen visibles.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.
