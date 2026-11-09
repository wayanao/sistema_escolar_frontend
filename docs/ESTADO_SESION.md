# Estado de Sesion

Estado actual del manejo de sesion en el frontend.

Ultima revision documental: 2026-08-08.

## Almacenamiento usado

La aplicacion usa `localStorage` para varios datos de sesion y seleccion.

Claves observadas:

- `usuario`: datos del usuario admin autenticado.
- `profesor`: datos del profesor autenticado.
- `super_admin`: datos del usuario de plataforma autenticado.
- `asignacionId`: seleccion academica usada por modulos de profesor.
- `periodo`: periodo seleccionado.
- `periodo_profesor_<id>`: ultimo periodo seleccionado por cada profesor en
  este navegador.
- `fechaAsistencia`: ya no se escribe ni se lee desde el 2026-11-09
  (Asistencia arranca siempre en la fecha de hoy). Puede seguir en
  navegadores que la guardaron antes; no tiene efecto.
- `planillaTipoEvaluacion`: tipo de evaluacion usado en planilla.
- `ultimo_codigo_colegio`: ultimo codigo de colegio usado en un login exitoso,
  solo para precargar el campo visual del formulario.
- `menuLateral`: si el admin o el profesor dejó el menú lateral `abierto` o
  en `riel` (encogido) desde portátil. Desde el 2026-11-04.
- `borrador_boletin:<tenant>:<profesor>:<asignacion>:<periodo>`: lo que el
  profesor escribió en el boletín final y no ha guardado (solo los textos de
  los estudiantes con cambios). Desde el 2026-11-07. Se borra al guardar, al
  "Descartar" y en logout. Prefijo en `src/constants/borradores.js`.

Separacion importante:

- `usuario`, `profesor` y `super_admin` son datos visuales de sesion.
- `asignacionId`, `periodo` y `planillaTipoEvaluacion` son selecciones de
  trabajo del perfil profesor. Se eligen arriba de Planilla, Asistencia,
  Planeador anual y rankings (`hooks/useClaseDeTrabajo.js`); desde el
  2026-11-09 el panel ya no los elige.
- `periodo_profesor_<id>` es una preferencia local por docente. Permite que un
  profesor vuelva a entrar y recupere su ultimo periodo aunque el logout haya
  limpiado `periodo`.
- `ultimo_codigo_colegio` es una preferencia local del login; no autoriza,
  no define tenant y no reemplaza el codigo enviado al backend.
- `menuLateral` es una preferencia de la pantalla, no de la sesión: no se
  limpia en logout ni ante `401`, como `ultimo_codigo_colegio`.
- `borrador_boletin:*` es trabajo sin guardar, con texto sobre estudiantes
  (dato personal): nunca autoriza nada, no lo ve el colegio hasta que el
  profesor guarda, y lleva tenant y profesor en la clave para que en un
  navegador compartido cada uno vea solo el suyo.

Tambien se usa cookie:

- `token`: cookie de sesion emitida por backend. En produccion debe ser
  HttpOnly; si no es legible por JavaScript, viaja automaticamente por
  `withCredentials: true`.

Nota:

- El tenant se conserva dentro de `usuario`, `profesor` o `super_admin` solo
  como dato informativo de sesion visual.
- El frontend ya no guarda `tenant` como clave separada ni lo envia como header.
- `src/utils/api.js` todavia limpia `localStorage.tenant` ante `401` como
  compatibilidad con sesiones viejas.

## Flujo de login

`useComandoLogin`, compuesto por `pages/Login.jsx` con `LoginFormView`:

1. Envia credenciales a `POST /login`.
2. Recibe datos minimos de sesion y la cookie `token` queda configurada por el
   backend.
3. Guarda `ultimo_codigo_colegio` solo despues de un login exitoso para
   recordar el ultimo codigo real usado. No precarga `demo` por defecto.
4. Si el rol es `super_admin`, guarda `super_admin`.
5. Si el rol es `admin`, guarda `usuario`.
6. Si no es admin, guarda `profesor`.
7. Redirige segun rol y, para admin inicial con password temporal, a
   `/cambiar-password`.

## Flujo de logout

`useCerrarSesion`, conectado por los layouts de `App.jsx` a las tres vistas de
navegacion, elimina:

- `profesor`
- `usuario`
- `super_admin`
- `tenant` como limpieza legacy
- `asignacionId`
- `periodo`
- todas las claves que empiezan con `borrador_boletin:` (prefijos en
  `PREFIJOS_LIMPIEZA_LOGOUT`, desde el 2026-11-07): en un computador
  compartido, quien entra después no debe encontrar textos de otro profesor.

Tambien llaman `POST /logout`, intentan expirar la cookie `token` como
compatibilidad para desarrollo y redirigen a `/login`.

El mismo comando se usa para admin, profesor y super admin.

Nota operativa:

- `periodo_profesor_<id>` no se elimina en logout. Es una preferencia local por
  profesor, no una autorizacion ni un dato sensible.
- `fechaAsistencia` y `planillaTipoEvaluacion` pueden quedar como preferencias
  locales de trabajo si no se limpian explicitamente en el logout. Si se
  observan selecciones antiguas al cambiar de usuario, conviene centralizar una
  limpieza unica de sesion/trabajo.

## Limpieza automatica por 401

`src/utils/api.js` limpia sesion cuando el backend responde `401`:

- Cookie `token`.
- `super_admin`.
- `usuario`.
- `profesor`.
- `tenant` como limpieza legacy.

Luego redirige a `/login`.

No borra `borrador_boletin:*` a propósito: si la sesión vence mientras el
profesor escribe, al volver a entrar encuentra lo que no alcanzó a guardar.

## Uso de sesion en rutas

`App.jsx` revisa `localStorage` para decidir:

- Si el usuario puede entrar al layout autenticado.
- Si debe usar menu admin o menu profesor.
- Si una ruta admin puede renderizarse.

## Riesgos pendientes observados

- Parte del estado sensible se conserva en `localStorage`.
- La UI depende de datos de sesion locales para mostrar u ocultar rutas.
- La expiracion real del token y permisos depende del backend.
- Las selecciones de trabajo compartidas por modulos del profesor pueden quedar
  viejas si un usuario cambia de curso, periodo o cuenta sin refrescar el flujo.
