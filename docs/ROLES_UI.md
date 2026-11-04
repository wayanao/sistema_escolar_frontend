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

El layout general (`/*`) sin `usuario` ni `profesor` redirige a `/login`, salvo
en `/`: ahi muestra la landing publica (desde el 2026-10-26). La landing no da
acceso a nada; es solo informativa y lleva al login.

## Menus por rol

`App.jsx` decide el menu principal:

- `MenuLateralView` dentro de `MarcoAdmin` cuando existe `usuario` con rol
  `admin`, y dentro de `MarcoProfesor` cuando no hay admin y existe profesor.
  Desde el 2026-11-04; antes eran `NavAdminView` y `NavProfesorView`, ya
  borrados.
- `NavSuperAdminView` en la ruta `/super-admin`.

La entrada `Listas de Seguimiento`, del grupo Gestion Academica, se agrego el
2026-09-22. Hasta el 2026-11-04 las entradas de los menús vivían **en dos
archivos** (`navegacion.js` para escritorio y la barra de cada rol, a mano,
para móvil). Desde el menú lateral, `ADMIN_DESKTOP_ITEMS` y
`PROFESOR_DESKTOP_ITEMS` de `src/utils/autenticacion/navegacion.js` arman el
menú en PC, tablet y celular: una entrada nueva se agrega solo ahí. Qué
pantallas del profesor van en la barra de abajo del celular lo dice
`PROFESOR_BARRA_INFERIOR`; las demás quedan en «Más».

Desde el 2026-10-06, el admin tiene además la entrada `Años lectivos` en los
dos menús. Abre `/admin/anios-lectivos` bajo `AdminRoute`; profesor y
`super_admin` no reciben esa opción. La autorización real de crear o copiar
un año vuelve a validarla el backend.

Desde el 2026-10-13, `/admin/anios-lectivos/admisiones` (entrevista de
admisión, paso E4) también va bajo `AdminRoute`: son datos personales de
menores (Ley 1581 de 2012). Un profesor que escriba la dirección termina en
`/login`, y el backend responde `403` a cualquier usuario que no sea admin en
todas sus rutas. No tiene entrada en el menú: se llega desde Años lectivos.
Los botones de registrar, editar, poner resultado y borrar se ocultan con el
`editable` que manda el backend, no con una regla propia.

## Validaciones adicionales en paginas

Algunas paginas administrativas leen `usuario` desde `localStorage` y validan el rol antes de mostrar contenido o continuar.

`/admin/listas-seguimiento` no lee `localStorage` por su cuenta: se apoya solo
en `AdminRoute`. La proteccion real la da el backend, cuyo router
`/listas-seguimiento` es admin-only a nivel de router; un profesor recibe 403
en los cuatro endpoints aunque llegue a la direccion.

Firma del acudiente en el observador (2026-10-27,
`docs/funcionalidades/FIRMA_OBSERVADOR.md`): el boton «Firmar con el
acudiente» se pinta donde el backend dice `puede_firmar` en cada anotacion; la
pantalla no calcula quien puede. Lo ven el autor, el director de grupo y el
**admin**, que en la ficha del estudiante sigue sin escribir ni editar, pero
ahora puede tomar firmas. `[Editar]` deja de pintarse en lo firmado
(`puedeEditarAnotacion`); el backend responde 409 si alguien lo intenta igual.

## Riesgo pendiente observado

Estas validaciones de rol son de frontend. Protegen la experiencia de usuario, pero no reemplazan las validaciones del backend. La seguridad real depende de que cada endpoint valide token, rol, tenant y permisos.

Notas operativas SaaS:

- `super_admin` es rol de plataforma; no debe depender de un tenant de colegio
  para autorizar acciones.
- `admin` y `profesor` operan dentro de un tenant/colegio resuelto por backend
  desde cookie/token.
- La UI puede ocultar rutas, pero cualquier bloqueo real de tenant suspendido,
  cancelado o permisos debe hacerse en backend.
