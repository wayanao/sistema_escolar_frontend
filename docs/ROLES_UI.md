# Roles UI

Estado actual del manejo de roles en la interfaz.

## Roles observados

La UI distingue principalmente:

- `admin`: usuario administrativo.
- `profesor`: usuario no admin guardado como `profesor`.
- `super_admin`: usuario de plataforma guardado como `super_admin`.

El rol se obtiene desde la respuesta de login y se guarda en `localStorage`.

## Login

`LoginForm.jsx` envia:

- `email`
- `password`
- `codigo_colegio`

Si la respuesta contiene `rol === "super_admin"`:

- Guarda la respuesta en `localStorage.super_admin`.
- Elimina `localStorage.usuario`.
- Elimina `localStorage.profesor`.
- Redirige a `/super-admin`.

Si la respuesta contiene `rol === "admin"`:

- Guarda la respuesta en `localStorage.usuario`.
- Elimina `localStorage.super_admin`.
- Elimina `localStorage.profesor`.
- Redirige a `/dashboard-admin`.

Si no es admin:

- Guarda la respuesta en `localStorage.profesor`.
- Elimina `localStorage.super_admin`.
- Elimina `localStorage.usuario`.
- Redirige a `/`.

Tambien guarda `tenant` en `localStorage.tenant`.

## Guards principales

`ProtectedRoute` permite acceso si existe:

- `localStorage.usuario`, o
- `localStorage.profesor`.

`AdminRoute` permite acceso si existe:

- `localStorage.usuario`
- y `usuario.rol === "admin"`.

`SuperAdminRoute` permite acceso si existe:

- `localStorage.super_admin`
- y `super_admin.rol === "super_admin"`.

Si falla la validacion, ambos redirigen a `/login`.

## Menus por rol

`App.jsx` decide el menu principal:

- `NavAdmin` cuando existe `usuario` con rol `admin`.
- `NavProfesor` cuando no hay admin y existe profesor.
- `NavSuperAdmin` en la ruta `/super-admin`.

## Validaciones adicionales en paginas

Algunas paginas administrativas leen `usuario` desde `localStorage` y validan el rol antes de mostrar contenido o continuar.

## Riesgo pendiente observado

Estas validaciones de rol son de frontend. Protegen la experiencia de usuario, pero no reemplazan las validaciones del backend. La seguridad real depende de que cada endpoint valide token, rol, tenant y permisos.
