# Roles UI

Estado actual del manejo de roles en la interfaz.

Ultima revision documental: 2026-08-08.

## Roles observados

La UI distingue principalmente:

- `admin`: usuario administrativo.
- `profesor`: usuario no admin guardado como `profesor`.
- `super_admin`: usuario de plataforma guardado como `super_admin`.

El rol se obtiene desde la respuesta de login y se guarda en `localStorage`.
La sesion real viaja en cookie `token` emitida por backend; los datos en
`localStorage` son apoyo visual de la UI.

## Login

`useComandoLogin`, compuesto en `pages/Login.jsx`, envia:

- `email`
- `password`
- `codigo_colegio`

El campo `codigo_colegio` ya no inicia con `demo`. El frontend solo precarga el
ultimo codigo de colegio guardado tras un login exitoso en
`localStorage.ultimo_codigo_colegio`.

Si la respuesta contiene `rol === "super_admin"`:

- Guarda la respuesta en `localStorage.super_admin`.
- Elimina `localStorage.usuario`.
- Elimina `localStorage.profesor`.
- Redirige a `/super-admin`.

Si la respuesta contiene `rol === "admin"`:

- Guarda la respuesta en `localStorage.usuario`.
- Elimina `localStorage.super_admin`.
- Elimina `localStorage.profesor`.
- Si `debe_cambiar_password` es `true`, redirige a `/cambiar-password`.
- Si no, redirige a `/dashboard-admin`.

Si no es admin:

- Guarda la respuesta en `localStorage.profesor`.
- Elimina `localStorage.super_admin`.
- Elimina `localStorage.usuario`.
- Redirige a `/`.

El objeto guardado conserva `tenant` y `debe_cambiar_password` como datos
informativos de sesion visual. Ya no se guarda `tenant` como clave separada ni
se envia un header de tenant desde el frontend.

## Guards principales

`ProtectedRoute` permite acceso si existe:

- `localStorage.usuario`, o
- `localStorage.profesor`.

Si el usuario admin tiene `debe_cambiar_password = true`, redirige a
`/cambiar-password`.

`AdminRoute` permite acceso si existe:

- `localStorage.usuario`
- y `usuario.rol === "admin"`.

Si el admin tiene password temporal pendiente, tambien redirige a
`/cambiar-password`.

`SuperAdminRoute` permite acceso si existe:

- `localStorage.super_admin`
- y `super_admin.rol === "super_admin"`.

Si falla la validacion, ambos redirigen a `/login`.

## Menus por rol

`App.jsx` decide el menu principal:

- `NavAdminView` cuando existe `usuario` con rol `admin`.
- `NavProfesorView` cuando no hay admin y existe profesor.
- `NavSuperAdminView` en la ruta `/super-admin`.

## Validaciones adicionales en paginas

Algunas paginas administrativas leen `usuario` desde `localStorage` y validan el rol antes de mostrar contenido o continuar.

## Riesgo pendiente observado

Estas validaciones de rol son de frontend. Protegen la experiencia de usuario, pero no reemplazan las validaciones del backend. La seguridad real depende de que cada endpoint valide token, rol, tenant y permisos.

Notas operativas SaaS:

- `super_admin` es rol de plataforma; no debe depender de un tenant de colegio
  para autorizar acciones.
- `admin` y `profesor` operan dentro de un tenant/colegio resuelto por backend
  desde cookie/token.
- La UI puede ocultar rutas, pero cualquier bloqueo real de tenant suspendido,
  cancelado o permisos debe hacerse en backend.
