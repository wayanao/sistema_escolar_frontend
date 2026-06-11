# Estado de Sesion

Estado actual del manejo de sesion en el frontend.

## Almacenamiento usado

La aplicacion usa `localStorage` para varios datos de sesion y seleccion.

Claves observadas:

- `usuario`: datos del usuario admin autenticado.
- `profesor`: datos del profesor autenticado.
- `super_admin`: datos del usuario de plataforma autenticado.
- `asignacionId`: seleccion academica usada por modulos de profesor.
- `periodo`: periodo seleccionado.
- `fechaAsistencia`: fecha usada en asistencia.
- `planillaTipoEvaluacion`: tipo de evaluacion usado en planilla.

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

`LoginForm.jsx`:

1. Envia credenciales a `POST /login`.
2. Recibe datos minimos de sesion y la cookie `token` queda configurada por el
   backend.
3. Si el rol es `super_admin`, guarda `super_admin`.
4. Si el rol es `admin`, guarda `usuario`.
5. Si no es admin, guarda `profesor`.
6. Redirige segun rol y, para admin inicial con password temporal, a
   `/cambiar-password`.

## Flujo de logout

`NavAdmin.jsx` y `NavProfesor.jsx` eliminan:

- `profesor`
- `usuario`
- `super_admin`
- `asignacionId`
- `periodo`

Tambien llaman `POST /logout`, intentan expirar la cookie `token` como
compatibilidad para desarrollo y redirigen a `/login`.

## Limpieza automatica por 401

`src/utils/api.js` limpia sesion cuando el backend responde `401`:

- Cookie `token`.
- `super_admin`.
- `usuario`.
- `profesor`.
- `tenant` como limpieza legacy.

Luego redirige a `/login`.

## Uso de sesion en rutas

`App.jsx` revisa `localStorage` para decidir:

- Si el usuario puede entrar al layout autenticado.
- Si debe usar menu admin o menu profesor.
- Si una ruta admin puede renderizarse.

## Riesgos pendientes observados

- Parte del estado sensible se conserva en `localStorage`.
- La UI depende de datos de sesion locales para mostrar u ocultar rutas.
- La expiracion real del token y permisos depende del backend.
