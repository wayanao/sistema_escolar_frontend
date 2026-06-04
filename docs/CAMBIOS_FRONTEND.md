# Cambios Frontend

Registro de documentacion del frontend.

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
