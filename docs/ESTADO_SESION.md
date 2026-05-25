# Estado de Sesion

Estado actual del manejo de sesion en el frontend.

## Almacenamiento usado

La aplicacion usa `localStorage` para varios datos de sesion y seleccion.

Claves observadas:

- `usuario`: datos del usuario admin autenticado.
- `profesor`: datos del profesor autenticado.
- `tenant`: tenant actual.
- `asignacionId`: seleccion academica usada por modulos de profesor.
- `periodo`: periodo seleccionado.
- `fechaAsistencia`: fecha usada en asistencia.
- `planillaTipoEvaluacion`: tipo de evaluacion usado en planilla.

Tambien se usa cookie:

- `token`: leida con `js-cookie` por `src/utils/api.js`.

## Flujo de login

`LoginForm.jsx`:

1. Envia credenciales a `POST /login`.
2. Guarda `tenant`.
3. Si el rol es `admin`, guarda `usuario`.
4. Si no es admin, guarda `profesor`.
5. Redirige segun rol.

## Flujo de logout

`NavAdmin.jsx` y `NavProfesor.jsx` eliminan:

- `profesor`
- `usuario`
- `asignacionId`
- `periodo`

Tambien intentan expirar la cookie `token` y redirigen a `/login`.

## Limpieza automatica por 401

`src/utils/api.js` limpia sesion cuando el backend responde `401`:

- Cookie `token`.
- `usuario`.
- `profesor`.
- `tenant`.

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
