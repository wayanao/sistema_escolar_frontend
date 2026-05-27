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
