# Modularización: Autenticación, sesión y navegación

## Control

- Estado: Terminado; commit pendiente. Capas 0 a 7 completadas.
- Orden: 14.
- Riesgo inicial: Crítico.
- Flujo Git: `main` directo.
- Commit base: `32d4ce8417c1c0744123154bf96148ac690fd1e8`.
- Punto de recuperación: `main` y `origin/main` coincidían en el commit base y
  el working tree estaba limpio antes de iniciar la capa 0.
- Commit final: Pendiente.
- Última actualización: 2026-08-08 (capa 7, cierre).

## Objetivo

Separar autenticación, sesión, guards y navegación por rol sin debilitar
seguridad ni modificar la experiencia de acceso.

## Alcance confirmado

### Fuente principal del módulo

- `src/App.jsx`: rutas, layouts, guards y composición de navegación/sesión.
- `src/pages/Login.jsx`: raíz de composición del acceso.
- `src/pages/CambiarPassword.jsx`: raíz de composición del cambio obligatorio.
- `src/components/autenticacion/`: vistas de login, password, tenant y
  navegación por rol.
- `src/components/DesktopAnimatedNav.jsx`.
- `src/hooks/autenticacion/`: estado, guards, consultas y comandos.
- `src/services/autenticacionApi.js`: transporte de los cuatro flujos remotos.
- `src/utils/autenticacion/`: contratos y transformaciones puras.
- `src/utils/api.js`: cliente HTTP compartido e interceptor global de `401`.
- `src/config/env.js`: resolución de `API_BASE_URL` usada por el cliente.
- `src/utils/periodoProfesor.js`: preferencia por profesor que debe sobrevivir
  al logout.

### Dependencia compartida delimitada

- `src/components/planeaciones/NotificacionesPlaneadores.jsx` se monta en las navegaciones
  de admin y profesor, pero su consulta, agrupación, evento y destinos
  pertenecen a planeaciones.
- El módulo de autenticación conservará su integración por `rol` y
  `onNavigate`; no absorberá esa implementación sin una decisión transversal
  separada.

### Pruebas de caracterización creadas en capa 0

- `src/App.test.jsx`.
- `src/utils/api.test.js`.
- `src/components/LoginForm.test.jsx`.
- `src/pages/CambiarPassword.test.jsx`.
- `src/components/NavegacionSesion.test.jsx`.
- `src/components/TenantStatusBanner.test.jsx`.

No se modificó código productivo ni se realizó una extracción estructural en
la capa 0.

### Utilidades puras extraídas en capa 1

- `src/utils/autenticacion/sesion.js`:
  - roles, claves, rutas y conjuntos diferenciados de limpieza;
  - parseo con el mismo contrato estricto existente;
  - construcción y actualización inmutable de la sesión visual;
  - decisiones puras para guards y respuesta `401`.
- `src/utils/autenticacion/login.js`:
  - normalización del código de colegio y tratamiento del valor recordado;
  - validación de presencia, payload, nombre visible y destino por rol.
- `src/utils/autenticacion/password.js`:
  - requisitos en su orden actual, precedencia de validación y payload.
- `src/utils/autenticacion/navegacion.js`:
  - contratos de los menús desktop de admin y profesor;
  - coincidencia exacta, por descendiente y por grupo activo.

Cada unidad tiene su prueba colocada en la misma carpeta. Las utilidades no
realizan HTTP, no usan React ni DOM y no leen o escriben almacenamiento.

Consumidores actualizados al cerrar la capa 1, antes de extraer servicios y
hooks:

- `src/App.jsx` conserva la lectura de `localStorage` y delega solo parseo y
  decisiones de acceso.
- `src/components/LoginForm.jsx` conserva estado, HTTP, almacenamiento,
  alertas y redirección; delega transformaciones y contratos.
- `src/pages/CambiarPassword.jsx` conserva formulario, comando y alertas.
- Los tres menús conservan el comando de logout, cookie y navegación; iteran
  el conjunto puro de claves correspondiente.
- `src/utils/api.js` conserva Axios e interceptores; usa la decisión y las
  claves específicas de `401`.
- `DesktopAnimatedNav` conserva refs, medición, efectos y presentación; delega
  únicamente la coincidencia de rutas.

### Servicio HTTP extraído en capa 2

- `src/services/autenticacionApi.js` centraliza exclusivamente:
  - `POST /login`;
  - `POST /logout`;
  - `POST /auth/cambiar-password`;
  - `GET /tenant/status`.
- Cada función devuelve directamente `response.data` y deja pasar el mismo
  error de Axios. El servicio no decide mensajes, almacenamiento, cookies,
  navegación ni estado visual.
- `LoginForm`, `CambiarPassword`, los tres menús y `TenantStatusBanner` dejaron
  de importar el cliente Axios compartido para esos cuatro flujos.
- Los payloads continúan construyéndose con las utilidades puras antes de
  llegar al servicio; no se alteraron nombres, valores ni omisión de cuerpos.
- `src/utils/api.js` conserva `baseURL`, credenciales e interceptores. Solo el
  servicio de autenticación lo consume para estos endpoints.
- `NotificacionesPlaneadores` conserva su acceso directo al cliente compartido
  y sus endpoints porque pertenece al dominio de planeaciones.
- Se agregó `src/services/autenticacionApi.test.js` para proteger método, ruta,
  payload, retorno de datos y propagación de errores de las cuatro funciones.

### Estado y guards extraídos en capa 3

- `src/hooks/autenticacion/useSesion.js` coordina las lecturas locales con las
  decisiones puras ya existentes:
  - estado del layout general;
  - redirección de rutas protegidas;
  - redirección de rutas admin;
  - acceso al cambio obligatorio de password;
  - guard e identidad visual de super admin.
- Cada contexto conserva las mismas claves y el mismo orden de lectura. `/login`
  no lee identidades; los flujos admin leen solo `usuario`; super admin lee solo
  `super_admin`; los flujos generales leen `usuario` y luego `profesor`.
- Las sesiones se vuelven a leer en cada render, sin caché, suscripción a
  `storage` ni estado React propio. El parseo continúa siendo estricto y un JSON
  corrupto sigue propagando `SyntaxError`.
- `src/hooks/autenticacion/useEstadoTenant.js` realiza una consulta por montaje,
  devuelve el mismo objeto solo cuando `mostrar_aviso` es verdadero, oculta los
  errores y descarta respuestas posteriores al desmontaje.
- `App.jsx` conserva rutas y composición, pero delega lectura de sesión y guards
  a los hooks. `NavSuperAdmin` delega su identidad visual y
  `TenantStatusBanner` quedó limitado a presentar el aviso entregado por su
  hook.
- `useSesion.test.js` protege frecuencia, orden y aislamiento de claves,
  prioridades de guards y parseo estricto. `useEstadoTenant.test.js` protege
  consulta única, visibilidad, error silencioso y desmontaje.

### Comandos extraídos en capa 4

- `src/hooks/autenticacion/useComandoLogin.js` coordina los campos de dominio,
  validación, bloqueo tras renderizar el envío, temporizador de 3 segundos,
  servicio, persistencia por rol, alertas y redirección dura.
- El login conserva la diferencia temporal existente: espera el `Swal` exitoso
  antes de asignar `window.location.href`, pero no espera las alertas de error.
  La sesión visual booleaniza el flag y el destino continúa evaluando la
  respuesta cruda.
- `mostrarPassword` permanece en `LoginForm` porque es estado visual del control,
  no estado del comando. El componente conserva todo su JSX, textos y contrato
  accesible.
- `src/hooks/autenticacion/useCambiarPassword.js` coordina estado editable,
  precedencia de validaciones, payload, servicio, actualización estricta de
  `usuario`, alerta y navegación con `replace`.
- El cambio de password conserva que la navegación ocurre en `.then` del aviso
  exitoso sin esperarlo desde `guardar`; `saving` vuelve a falso en `finally`.
- `src/hooks/autenticacion/useCerrarSesion.js` reemplaza los tres comandos
  duplicados. Espera el request, registra el mismo error si falla y después
  realiza en ambos casos la limpieza de seis claves, cookie y navegación.
- `LoginForm`, `CambiarPassword` y los tres menús dejaron de importar servicios,
  `Swal`, almacenamiento, cookie o navegación para estos comandos.
- Los tres hooks tienen pruebas adyacentes de estado, orden de efectos,
  contratos remotos, almacenamiento, errores y recuperación.

### Presentación extraída en capa 5

- `src/components/autenticacion/LoginFormView.jsx` recibe campos, estados y
  acciones del comando de login. Conserva literalmente estructura, clases,
  textos, estados del botón, aviso lento y contrato accesible; solo mantiene
  local el toggle visual de la contraseña.
- `src/components/autenticacion/CambiarPasswordView.jsx` recibe los tres
  valores, sus cambios, el estado de guardado y el submit. No valida, consulta,
  persiste ni navega.
- `src/components/autenticacion/TenantStatusBannerView.jsx` presenta el aviso o
  `null` y conserva el fallback de mensaje y estado.
- `src/components/autenticacion/NavAdminView.jsx`, `NavProfesorView.jsx` y
  `NavSuperAdminView.jsx` conservan rutas, textos, clases y diferencias por rol.
  Los dos menús responsive mantienen localmente apertura, grupo activo y
  cierre visual al navegar.
- Los paths públicos existentes (`LoginForm`, `CambiarPassword`, los tres
  menús y `TenantStatusBanner`) quedaron como conectores mínimos que invocan
  hooks y entregan props explícitas a las vistas. `App.jsx` y `Login.jsx` no se
  consolidaron, porque esa responsabilidad corresponde a la capa 6.
- `NotificacionesPlaneadores` permanece fuera del dominio de autenticación y se
  integra mediante un renderer estable que recibe `onNavigate`; su ubicación
  actual es `components/planeaciones/` porque admin y profesor lo comparten.
  No se movieron su consulta, agrupación, evento ni destinos.
- `DesktopAnimatedNav` permanece como unidad presentacional existente y sigue
  consumiendo los contratos puros de navegación; no se realizó un traslado de
  carpeta sin beneficio arquitectónico.
- Se agregaron pruebas adyacentes para las seis vistas, incluidos props y
  acciones, estados visibles, toggle accesible, variantes del banner, rutas,
  metadatos, responsive y slot externo de notificaciones.

### Composición consolidada en capa 6

- `src/pages/Login.jsx` conecta directamente `useComandoLogin` con
  `LoginFormView` y conserva sin cambios el shell visual, assets, textos y
  metadatos de la página pública.
- `src/pages/CambiarPassword.jsx` ya cumplía el límite objetivo y se conservó
  como raíz que conecta `useCambiarPassword` con `CambiarPasswordView`.
- `src/App.jsx` continúa siendo el registro superior de rutas. Conserva todos
  los imports lazy, `PageLoader`, los tres límites de `Suspense`, la tabla de
  rutas y los guards en el mismo orden.
- Los layouts privados de `App.jsx` conectan ahora los hooks de sesión, logout,
  tenant e identidad super admin directamente con las vistas. Helpers locales
  sin DOM propio mantienen esas conexiones dentro de la raíz de composición.
- Los renderers de `NotificacionesPlaneadores` permanecen a nivel de módulo y
  conservan los roles exactos y el callback `onNavigate` estable para admin y
  profesor.
- El guard general sigue ejecutándose antes de montar navegación y tenant. En
  cambio, una sesión válida todavía monta el layout y su consulta de tenant
  antes de que un guard de ruta interno pueda redirigir; no se adelantó ni se
  retrasó ese efecto existente.
- Se retiraron `LoginForm.jsx`, `NavAdmin.jsx`, `NavProfesor.jsx`,
  `NavSuperAdmin.jsx` y `TenantStatusBanner.jsx` después de comprobar que no
  tenían otros consumidores productivos ni exports de paquete.
- La integración de login se trasladó a `src/pages/Login.test.jsx`; rutas y
  guards permanecen en `src/App.test.jsx`; y
  `src/App.composicion.test.jsx` protege el cableado de vistas, hooks, tenant,
  logout y notificaciones. Las pruebas de hooks y vistas continúan adyacentes a
  sus unidades.

## Contratos observados

### Transporte HTTP

| Flujo | Contrato actual |
|---|---|
| Cliente compartido | `baseURL: API_BASE_URL`, JSON y `withCredentials: true`. Si la cookie `token` es legible, agrega `Authorization: Bearer <token>` como fallback de desarrollo. |
| Login | `POST /login` con `{ email, password, codigo_colegio }`. Solo el código se normaliza con `trim().toLowerCase()`. |
| Cambio de password | `POST /auth/cambiar-password` con `{ password_actual, password_nueva }`; la respuesta no se consume. |
| Logout | `POST /logout`; aunque falle, los tres menús continúan con limpieza local y navegación. |
| Estado del tenant | `GET /tenant/status`; el banner se muestra solo si `mostrar_aviso` es verdadero. |
| Notificaciones compartidas | `GET /notificaciones/planeadores` con `limit: 20` para admin y `limit: 8` para profesor. Queda fuera de la extracción de este módulo. |

La respuesta de login se reduce para la UI al objeto:

```text
{ id, nombre, rol, tenant, debe_cambiar_password: Boolean(valor) }
```

La redirección inmediata todavía evalúa el valor crudo de
`debe_cambiar_password`; el contrato implícito del backend es un booleano real.

### Almacenamiento y limpieza

| Dato | Escritura/uso | Logout explícito | `401` global |
|---|---|---|---|
| Cookie `token` | La emite el backend y viaja con credenciales | Solicita `POST /logout` e intenta expirar la cookie con JavaScript | `Cookies.remove("token")` |
| `usuario` | Sesión visual admin | Elimina | Elimina |
| `profesor` | Sesión visual profesor | Elimina | Elimina |
| `super_admin` | Sesión visual de plataforma | Elimina | Elimina |
| `tenant` | Clave legacy; ya no se escribe | Elimina | Elimina |
| `asignacionId` | Selección de trabajo del profesor | Elimina | Conserva |
| `periodo` | Selección de trabajo actual | Elimina | Conserva |
| `fechaAsistencia` | Preferencia de trabajo | Conserva | Conserva |
| `planillaTipoEvaluacion` | Preferencia de planilla | Conserva | Conserva |
| `periodo_profesor_<id>` | Último periodo por profesor | Conserva | Conserva |
| `ultimo_codigo_colegio` | Código del último login exitoso | Conserva | Conserva |

El login guarda exactamente una de las tres claves de identidad y elimina las
otras dos. `ultimo_codigo_colegio` se guarda solo después de un login exitoso;
al leerlo se normaliza y el valor legacy exacto `demo` se presenta vacío.

### Roles, guards y redirecciones

| Caso | Resultado actual |
|---|---|
| `/login` | Pública incluso si ya existe una sesión local. |
| Sin `usuario` ni `profesor` en el layout general | Redirección a `/login`. |
| `profesor` en una ruta general | Layout con `NavProfesor`. |
| `usuario.rol === "admin"` | Layout con `NavAdmin`; acceso a rutas admin. |
| `usuario` con otro rol | Entra al layout general y recibe `NavProfesor`, pero no accede a rutas admin. |
| `usuario.debe_cambiar_password` verdadero | Tiene prioridad y redirige rutas protegidas a `/cambiar-password`. |
| `/cambiar-password` sin admin válido | Redirección a `/login`. |
| `/cambiar-password` con admin sin cambio pendiente | Redirección a `/dashboard-admin`. |
| `super_admin.rol === "super_admin"` | Acceso exclusivo a `/super-admin`. |
| Solo existe `super_admin` y se visita el layout general | Redirección a `/login`. |
| Ruta desconocida con sesión general | Conserva layout, menú y banner; el contenido queda vacío. |

Las lecturas usan `JSON.parse(localStorage.getItem(...) || "null")` durante el
render. No son reactivas por sí solas y un JSON corrupto puede romper el render.

### Inventario de rutas

Rutas protegidas para `usuario` o `profesor`:

- `/`
- `/planilla`
- `/Formulario`
- `/asistencia`
- `/ranking-rendimiento`
- `/ranking-mejor-rendimiento`
- `/plan-de-clases`
- `/planeador-anual`
- `/ingreso-boletin`

Rutas exclusivas de admin:

- `/dashboard-admin`
- `/admin`
- `/admin/pagos`
- `/admin/tipos-pagos`
- `/admin/cartera-vencida`
- `/admin/inventario`
- `/admin/ventas`
- `/admin/egresos`
- `/admin/prestamos`
- `/admin/nomina`
- `/admin/estudiantes`
- `/admin/reportes`
- `/admin/horarios`
- `/admin/planeadores-clases`
- `/admin/planeadores-clases/:planId`
- `/admin/certificados`
- `/admin/diseno-impresos`
- `/boletin`

Rutas especiales:

- `/login`: pública.
- `/cambiar-password`: admin con password temporal pendiente.
- `/super-admin`: super admin con rol exacto.

### Inventario de navegación por rol

Admin:

- Dashboard: `/dashboard-admin`.
- Gestión Académica: `/admin/horarios`, `/admin/planeadores-clases`,
  `/admin/certificados`, `/boletin` y `/admin/diseno-impresos`.
- Cartera: `/admin/pagos`, `/admin/tipos-pagos`,
  `/admin/cartera-vencida`, `/admin/inventario`, `/admin/ventas`,
  `/admin/egresos`, `/admin/prestamos` y `/admin/nomina`.
- Administración: `/admin`; Estudiantes: `/admin/estudiantes`; Reportes:
  `/admin/reportes`.

Profesor:

- Dashboard: `/`.
- Control Académico: `/planilla`, `/asistencia` y `/Formulario`.
- Planeación Académica: `/plan-de-clases` y `/planeador-anual`.
- Boletín Final: `/ingreso-boletin`.

Super admin:

- Logo y Tenants: `/super-admin`.
- Identidad visible opcional: `Plataforma: <nombre>`.

Invariantes de texto y metadatos a preservar:

- En admin, el enlace de pagos dice `Gestión de Pagos` en escritorio y
  `Pagos` en móvil.
- En profesor, el logout dice `Cerrar sesion` sin tilde.
- `/Formulario` conserva la `F` mayúscula.
- Nómina conserva `translate="no"`.
- Los menús admin y profesor muestran navegación de escritorio desde `lg`,
  hamburguesa debajo de `lg` y la campana en ambos modos.
- Solo un grupo móvil queda abierto; navegar cierra el menú y reinicia el grupo.
- `DesktopAnimatedNav` considera activos los paths exactos, los descendientes
  por prefijo y los grupos con un hijo activo. Sus clases `desktop-*` forman
  parte del contrato con CSS.

### Login y password temporal

- Campos obligatorios de login: código del colegio, correo y contraseña.
- Estados del botón: `Entrar a Auligo`, `Verificando acceso...` y
  `Acceso correcto`.
- A los 3 segundos aparece el aviso de conexión lenta.
- `401`, `403` y error de red conservan mensajes distintos.
- Destinos después de login: super admin a `/super-admin`; admin temporal a
  `/cambiar-password`; admin normal a `/dashboard-admin`; profesor a `/`.
- La nueva password exige al menos 10 caracteres, una mayúscula ASCII, una
  minúscula ASCII y un número.
- El orden de validación es fortaleza, confirmación y diferencia frente a la
  password temporal.
- Tras éxito se fija `usuario.debe_cambiar_password = false` y se navega a
  `/dashboard-admin` con `replace: true`.

## Matriz de caracterización de capa 0

| Riesgo | Protección agregada |
|---|---|
| Admin | Persistencia de una sola identidad, acceso admin, prioridad del password temporal, menú/rutas y logout exitoso o fallido. |
| Profesor | Persistencia de una sola identidad, acceso general, rechazo de rutas admin, menú/rutas y logout exitoso o fallido. |
| Super admin | Clave y rol exactos, aislamiento del layout general, identidad visual, ruta única y logout exitoso o fallido. |
| Sesión vencida | Configuración con credenciales, fallback `Authorization`, limpieza exacta por `401`, excepción en `/login` y propagación del mismo error. |
| Password temporal | Reglas y precedencia local, payload exacto, actualización de la sesión visual, navegación y mensaje de error. |
| Login | Código recordado, validación obligatoria, toggle accesible, payload, sesión por rol y mensajes `401`/`403`/red. |
| Tenant | Consulta, visibilidad condicional, mensaje del backend, fallback y ocultamiento ante error. |
| Navegación | Textos, destinos, diferencias desktop/móvil, grupos y metadatos sensibles. |

La redirección dura de `window.location.href` después del login y del
interceptor se conserva por inventario de código; JSDOM no navega a otro
documento. Las pruebas protegen el estado previo, la limpieza y la matriz de
guards. La verificación manual final deberá cubrir los destinos reales.

## Invariantes

- Cookie de sesión y `withCredentials`.
- Datos visuales de admin, profesor y super admin.
- Redirecciones por rol y password temporal.
- Limpieza diferenciada por logout y respuesta `401`.
- Preferencias locales que sobreviven o se limpian según la matriz registrada.
- Menús responsive, textos, mayúsculas y rutas protegidas actuales.
- Autoridad real de permisos, tenant y expiración en el backend.

## Decisiones de capa 0

1. Registrar como base el `HEAD` limpio y publicado
   `32d4ce8417c1c0744123154bf96148ac690fd1e8`; no existía un hash previo en este
   documento que lo contradijera.
2. Cerrar la capa con caracterización, inventario y documentación, sin mover
   lógica productiva.
3. Mantener `src/utils/api.js` como dependencia transversal. En capas
   posteriores solo se extraerá el contrato de sesión sin mover transportes de
   otros dominios.
4. Mantener `NotificacionesPlaneadores` en su dominio actual y proteger solo su
   integración con los menús.
5. Registrar, pero no corregir, comportamientos dudosos o legacy; cualquier
   cambio funcional requiere una tarea separada.

## Decisiones de capa 1

1. Separar `sesion`, `login`, `password` y `navegacion` para mantener contratos
   pequeños; no crear un registro genérico ni una fábrica por rol.
2. Conservar `JSON.parse(valor || "null")` sin recuperación. Hacerlo tolerante
   cambiaría el comportamiento documentado y no corresponde a esta capa.
3. Conservar la coerción booleana al guardar la sesión, la evaluación truthy
   del flag recibido para redirigir y el fallback de cualquier rol desconocido
   a profesor.
4. Mantener conjuntos diferentes para logout y `401`. Compartir una única lista
   eliminaría selecciones que hoy sobreviven a la sesión vencida.
5. Extraer los árboles desktop y el matcher, pero dejar el menú móvil en sus
   componentes. Unificar renderers adelantaría la capa presentacional y
   borraría diferencias actuales como `Gestión de Pagos` frente a `Pagos`.
6. Mantener peticiones, `localStorage`, cookies, timers, navegación y estado
   React en los consumidores hasta sus capas de servicio, hooks y comandos.
7. No mover `periodoProfesor.js`: accede a almacenamiento y además es consumido
   por otros dominios; no es una utilidad pura de esta extracción.

## Decisiones de capa 2

1. Devolver `response.data` desde el servicio, en línea con el contrato del plan
   maestro, y adaptar los consumidores sin cambiar las ramas que usan esos
   datos.
2. No capturar ni traducir errores en el servicio. Los consumidores reciben la
   misma instancia y conservan sus mensajes, limpieza local y recuperación.
3. Reutilizar el cliente `src/utils/api.js` para preservar `baseURL`,
   `withCredentials`, fallback de `Authorization` e interceptor global de
   `401`.
4. Mantener la construcción y normalización de payloads en utilidades puras;
   el servicio se limita al transporte HTTP.
5. Mantener fuera del servicio la limpieza de logout, cookies, navegación, el
   estado del banner y su descarte de respuestas tras desmontar. Esos efectos
   corresponden a las capas de hooks y comandos.
6. No absorber `NotificacionesPlaneadores`: compartir el mismo cliente Axios no
   convierte sus consultas en autenticación.

## Decisiones de capa 3

1. Mantener lectores privados y hooks específicos en lugar de un estado global
   de tres identidades. Leer todas las claves en toda ruta rompería el
   aislamiento actual y haría que `/login` pudiera fallar por almacenamiento
   corrupto.
2. No usar `useState`, `useMemo`, `useSyncExternalStore` ni eventos de
   almacenamiento para las identidades. El contrato actual es una lectura en
   cada render, no una sesión reactiva.
3. Conservar por separado la lectura del layout y la de cada guard anidado. Esta
   duplicación mantiene el momento exacto en que hoy se observa
   `localStorage`.
4. Mantener las decisiones de rol y redirección en utilidades puras; los hooks
   solo coordinan esas decisiones con almacenamiento y React.
5. Hacer que el hook del tenant devuelva `null` o el mismo aviso del backend,
   sin introducir estados públicos de carga/error, reintentos ni cancelación de
   transporte. El control `mounted` existente se conservó como descarte local.
6. Dejar lecturas y mutaciones ligadas a login, cambio de password, logout e
   interceptor `401` en sus consumidores. Son comandos y corresponden a la
   capa 4.

## Decisiones de capa 4

1. Crear un hook por comando en lugar de un controlador genérico de sesión.
   Login, cambio de password y logout tienen secuencias y recuperaciones
   distintas que deben seguir visibles.
2. Mantener el toggle de visibilidad de password y el estado de apertura de los
   menús dentro de sus componentes. Son estado visual y moverlos al hook de
   dominio adelantaría la capa presentacional.
3. Trasladar el login literalmente: guard basado en `isSubmitting`, sin refs;
   timer limpiado en `finally`; `accesoConfirmado` fijado antes del aviso;
   `Swal` exitoso esperado y alertas de error no esperadas.
4. Conservar en cambio de password el parseo estricto dentro del mismo `try`, la
   escritura solo cuando existe usuario y la navegación en `.then`. No se agregó
   bloqueo imperativo ni limpieza de campos.
5. Compartir `useCerrarSesion` entre los tres menús porque existe uso real
   idéntico. No se agregó estado de progreso y se mantuvo la espera del request
   antes de toda limpieza.
6. Mantener el interceptor global de `401` en `src/utils/api.js`. Es un efecto
   transversal del cliente Axios, no un comando iniciado desde React, y conserva
   un conjunto de limpieza diferente al logout explícito.
7. No introducir `useCallback`, abortos, reintentos, tolerancia de parseo ni
   traducción adicional de errores; cualquiera cambiaría contratos observables
   o ampliaría esta migración.

## Decisiones de capa 5

1. Crear vistas explícitas por flujo y rol en lugar de un formulario o menú
   genérico. Admin, profesor y super admin tienen rutas, copys, grupos y
   estructura suficientemente distintos para que una fábrica ocultara
   contratos actuales.
2. Conservar temporalmente los paths públicos como conectores mínimos. Así la
   extracción presentacional no modifica a la vez raíces de composición,
   imports lazy ni límites de `Suspense`.
3. Mantener en las vistas únicamente estado visual: visibilidad de password,
   menú responsive y grupo móvil abierto. Estado de dominio, efectos,
   consultas y comandos permanecen en hooks.
4. Preservar el contrato de submit de cada flujo: la vista de login evita el
   evento por defecto y llama al comando sin argumentos; la de cambio de
   password entrega el evento al hook, que conserva allí el `preventDefault`.
5. Hacer que la vista del tenant presente el valor recibido sin volver a
   evaluar `mostrar_aviso`; esa decisión continúa exclusivamente en el hook de
   consulta.
6. Integrar `NotificacionesPlaneadores` mediante un renderer declarado fuera
   del conector para conservar una referencia estable. No se absorbió el
   dominio ni se introdujeron remontajes o nuevas consultas por una función
   recreada en cada render.
7. Mantener `DesktopAnimatedNav` en su ubicación pública actual. Ya era una
   unidad presentacional y moverla solo para uniformar carpetas añadiría churn
   sin separar una responsabilidad nueva.

## Decisiones de capa 6

1. Mantener la tabla de rutas dentro de `App.jsx`. Trasladar más de veinte
   páginas lazy a otro archivo no mejoraría la composición y ampliaría el
   riesgo sobre chunks, fallbacks y guards.
2. Hacer que `Login.jsx` conecte el comando con la vista y conservar
   `CambiarPassword.jsx` tal como estaba. Ambas páginas quedan como raíces de
   composición sin introducir controladores intermedios.
3. Usar helpers privados en `App.jsx` para navegación y aviso tenant. Así los
   hooks se montan solo dentro del layout autorizado y los helpers no crean DOM
   ni una API compartida nueva.
4. Mantener separados `SuperAdminRoute`, `SuperAdminLayout` y su navegación. Un
   acceso rechazado continúa leyendo solo el guard; un acceso autorizado
   conserva la lectura visual posterior de `super_admin`.
5. Declarar fuera del render los dos adaptadores de notificaciones. Se
   preservan referencias estables, `rol="admin"`/`rol="profesor"` y el cierre
   móvil recibido por `onNavigate`.
6. Retirar conectores públicos únicamente después de demostrar cero
   consumidores productivos. No se dejaron reexports de compatibilidad ni
   wrappers usados solo por pruebas.
7. Conservar que un layout general con sesión se monta antes de resolver su
   guard interno. Por ello una ruta que después redirige por rol o password
   puede iniciar una consulta tenant; corregir ese orden sería un cambio
   funcional separado.
8. Reubicar la cobertura por responsabilidad: página para login, `App` para
   rutas y composición, hooks para efectos y vistas para DOM/callbacks. La
   menor cantidad final de pruebas no elimina casos; reemplaza integraciones
   duplicadas de los conectores retirados.

## Riesgos abiertos

- La autorización visual depende de objetos manipulables en `localStorage`;
  el backend debe seguir validando token, rol, tenant y permisos.
- Las lecturas de sesión encapsuladas conservan `JSON.parse` estricto: pueden
  fallar por datos corruptos y no reaccionan por sí solas a cambios de
  almacenamiento.
- Cualquier rol distinto de `admin` y `super_admin` se persiste como profesor;
  además, un objeto `usuario` no admin entra al layout general.
- El flag normalizado se guarda como booleano, pero la redirección inmediata
  usa el valor crudo del backend.
- Logout y `401` limpian conjuntos distintos; unificarlos sin conservar esa
  diferencia afectaría preferencias de trabajo.
- El logout espera el request antes de limpiar. Una petición que no resuelve
  mantiene temporalmente la sesión visual.
- JavaScript no puede garantizar la eliminación de una cookie HttpOnly; el
  backend conserva la responsabilidad de invalidarla.
- La cobertura DOM protege contratos de clases y contenido, pero no sustituye
  una revisión visual responsive.
- Las notificaciones no cancelan requests ni descartan respuestas antiguas; es
  un riesgo del dominio compartido, no una corrección de autenticación.
- El login exitoso mantiene el formulario bloqueado mientras espera su alerta;
  no existe cancelación ni recuperación nueva si esa promesa no termina.
- El cambio de password depende del `disabled` tras renderizar y no incorpora
  un guard imperativo adicional contra invocaciones concurrentes.
- La consulta del tenant no aborta el transporte al desmontar; conserva el
  comportamiento previo de ignorar localmente cualquier respuesta tardía.
- Con una sesión general válida, navegación y tenant se montan antes de que el
  guard de la ruta interna redirija por rol o password temporal. La consulta
  puede iniciarse durante esa transición, igual que antes de la consolidación.
- La navegación conserva dos representaciones coordinadas: contratos puros
  para desktop y JSX móvil por rol. Sus rutas deben seguir sincronizadas; la
  separación presentacional no elimina ese riesgo existente.

## Verificación registrada

Línea base, antes de cambios:

- `pnpm run check:deploy`: correcto.
- Vitest: 256 archivos y 1340 pruebas correctas.
- ESLint: correcto.
- Build de producción: correcto.

Capa 0:

- `pnpm exec vitest run` sobre los seis archivos específicos: 6 archivos y 47
  pruebas correctas.
- `pnpm exec eslint` sobre los seis archivos nuevos: correcto.
- `git diff --check`: sin errores de whitespace; Git solo informó la conversión
  futura de LF a CRLF del documento en este checkout de Windows.
- No se ejecutó un nuevo build porque la capa solo agrega pruebas y
  documentación; el build base ya era correcto.

Capa 1:

- `pnpm exec vitest run` sobre utilidades y caracterización: 10 archivos y 118
  pruebas correctas.
- `pnpm exec eslint` sobre archivos productivos y pruebas del módulo: correcto.
- `pnpm run build`: correcto; 368 módulos transformados.
- Vitest conserva el aviso esperado de JSDOM al intentar la redirección dura
  existente a otro documento; no es un fallo de prueba.

Capa 2:

- `pnpm exec vitest run` sobre servicio y consumidores HTTP: 6 archivos y 44
  pruebas correctas.
- Regresión conjunta de las capas 0 a 2: 11 archivos y 126 pruebas correctas.
- `pnpm exec eslint` sobre archivos productivos y pruebas del módulo: correcto.
- `pnpm run build`: correcto; 369 módulos transformados.
- La búsqueda de fronteras confirma que los cuatro endpoints aparecen solo en
  `src/services/autenticacionApi.js`; la importación directa restante de
  `utils/api.js` en `NotificacionesPlaneadores` es la excepción de dominio ya
  documentada.
- Vitest conserva el aviso esperado de JSDOM por la redirección dura existente;
  no es un fallo de prueba.

Capa 3:

- Antes de extraer, la caracterización ampliada de rutas y navegación pasó 2
  archivos y 23 pruebas; la del banner pasó 1 archivo y 4 pruebas.
- Pruebas específicas de hooks y consumidores: 5 archivos y 37 pruebas
  correctas.
- Regresión conjunta de las capas 0 a 3: 13 archivos y 139 pruebas correctas.
- `pnpm exec eslint` sobre archivos productivos y pruebas del módulo: correcto.
- `pnpm run build`: correcto; 371 módulos transformados.
- La búsqueda de fronteras confirma que `App`, `NavSuperAdmin` y
  `TenantStatusBanner` ya no leen almacenamiento ni coordinan la consulta. Las
  operaciones locales restantes pertenecen a los comandos documentados para
  la capa 4.
- Vitest conserva el aviso esperado de JSDOM por la redirección dura existente;
  no es un fallo de prueba.

Capa 4:

- Antes de extraer, la caracterización de login, cambio de password y logout
  pasó 3 archivos y 25 pruebas.
- Pruebas específicas de comandos y consumidores: 6 archivos y 48 pruebas
  correctas.
- Regresión conjunta de las capas 0 a 4: 16 archivos y 162 pruebas correctas.
- `pnpm exec eslint` sobre archivos productivos y pruebas del módulo: correcto.
- `pnpm run build`: correcto; 374 módulos transformados.
- La búsqueda de fronteras confirma que los consumidores migrados ya no
  importan el servicio ni contienen almacenamiento, cookies, alertas o timers.
  Las implementaciones de login, cambio de password y logout aparecen una sola
  vez en sus hooks.
- Vitest conserva el aviso esperado de JSDOM por la redirección dura existente;
  no es un fallo de prueba.

Capa 5:

- Antes de extraer, la caracterización de login, cambio de password, banner y
  navegaciones pasó 4 archivos y 28 pruebas.
- Pruebas específicas de vistas y conectores: 8 archivos y 40 pruebas
  correctas.
- Regresión conjunta de las capas 0 a 5: 20 archivos y 174 pruebas correctas.
- `pnpm exec eslint` sobre archivos productivos y pruebas del módulo: correcto.
- `pnpm run build`: correcto; 380 módulos transformados.
- La búsqueda de fronteras confirma que las vistas nuevas no importan
  servicios, almacenamiento, alertas ni hooks de dominio. Las únicas instancias
  de `useState` de esa carpeta corresponden al toggle de password y al estado
  responsive de admin y profesor.
- El JSX extraído aparece una sola vez en las vistas; los paths públicos
  migrados contienen únicamente la conexión de hooks y props.
- Vitest conserva el aviso esperado de JSDOM por la redirección dura existente;
  no es un fallo de prueba.

Capa 6:

- Antes de consolidar, la caracterización de `App`, login, cambio de password,
  navegaciones, banner y vistas pasó 9 archivos y 54 pruebas.
- Las pruebas transicionales hicieron explícitos dos contratos existentes: el
  callback visual de logout recibe el evento React y el tenant puede montarse
  antes de un redirect de guard interno. Se corrigieron solo las expectativas,
  no el código productivo para alterar esos comportamientos.
- Pruebas específicas de las raíces y vistas: 8 archivos y 50 pruebas
  correctas.
- Regresión conjunta de las capas 0 a 6: 19 archivos y 170 pruebas correctas.
- `pnpm exec eslint` sobre archivos productivos y pruebas del módulo: correcto.
- `pnpm run build`: correcto; 375 módulos transformados. Los cinco módulos
  menos frente a la capa anterior corresponden a los conectores retirados.
- La búsqueda de consumidores confirma que no quedan imports ni archivos de
  los cinco conectores antiguos. Login, layouts y guards contienen composición,
  pero no transporte, almacenamiento, alertas ni transformaciones de dominio.
- La tabla de rutas, lazy imports, fallbacks y límites de `Suspense` permanece
  en `App.jsx`.
- `git diff --check`: sin errores de whitespace; Git solo informó la conversión
  futura de LF a CRLF de archivos ya editados en este checkout de Windows.
- La revisión de `git status` confirma que el diff acumulado pertenece a
  autenticación, sesión, navegación y su documento. `check:deploy` y la
  documentación global se reservan para la capa 7.
- Vitest conserva el aviso esperado de JSDOM por la redirección dura existente;
  no es un fallo de prueba.

Capa 7:

- La documentación específica quedó cerrada y se sincronizaron el plan maestro,
  `ARQUITECTURA_FRONTEND.md`, `COMPONENTES.md`, `CAMBIOS_FRONTEND.md` y las
  referencias operativas de API, sesión, roles, rutas, checklist y producción.
- Regresión específica final: 19 archivos y 170 pruebas correctas.
- `pnpm run check:deploy`: correcto; 275 archivos y 1510 pruebas, ESLint y
  build de producción de 375 módulos correctos.
- `git diff --check`: correcto; solo se informaron conversiones futuras de LF a
  CRLF de archivos editados en este checkout de Windows.
- Los cuatro endpoints del módulo aparecen únicamente en
  `src/services/autenticacionApi.js`. `NotificacionesPlaneadores` conserva su
  consulta fuera de esta frontera por pertenecer al dominio de planeaciones.
- Las vistas no contienen transporte, almacenamiento, cookies, alertas ni
  decisiones de dominio; las utilidades no contienen React, DOM,
  almacenamiento ni HTTP.
- No quedan archivos, imports ni implementaciones paralelas de `LoginForm`,
  `NavAdmin`, `NavProfesor`, `NavSuperAdmin` o `TenantStatusBanner` dentro del
  módulo. Las lecturas o redirects de otros dominios no se reinterpretaron como
  duplicados de autenticación y quedaron fuera del diff.
- La auditoría de `git status`, archivos rastreados y no rastreados confirma que
  el diff pertenece a autenticación, sesión, navegación y su documentación.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Completada |
| 1. Utilidades puras | Completada |
| 2. Servicio de sesión | Completada |
| 3. Estado y guards | Completada |
| 4. Comandos de login/logout | Completada |
| 5. Presentación | Completada |
| 6. Composición | Completada |
| 7. Cierre | Completada |

## Verificación manual pendiente en producción

Después del commit, push y deploy que realizará el usuario:

1. Abrir `/login` sin sesión y confirmar shell visual, textos, tres campos,
   código de colegio recordado y toggle accesible de contraseña.
2. Probar credenciales inválidas (`401`), colegio suspendido/cancelado (`403`)
   y un fallo de red; confirmar que cada mensaje conserva su texto y que no se
   crea una sesión local.
3. Iniciar como profesor y confirmar destino `/`, menú desktop/móvil, grupos,
   campana, rutas con `/Formulario` en mayúscula, banner tenant y logout.
4. Iniciar como admin normal y confirmar `/dashboard-admin`, menú desktop/móvil,
   `Gestión de Pagos` frente a `Pagos`, `Nómina`, rutas administrativas,
   notificaciones y logout.
5. Iniciar como admin con password temporal, confirmar redirección a
   `/cambiar-password`, reglas y precedencia de validación, actualización
   exitosa y destino `/dashboard-admin` con reemplazo de historial.
6. Iniciar como super admin, confirmar `/super-admin`, identidad
   `Plataforma: <nombre>`, ausencia del layout general y logout.
7. Con tenant activo confirmar ausencia de banner; con `mostrar_aviso` verdadero
   confirmar mensaje, estado y posición entre navegación y contenido.
8. Forzar una respuesta `401` en una ruta protegida y confirmar limpieza de las
   tres identidades, redirección dura a `/login` y conservación de las
   preferencias registradas para sesión vencida.
9. Recargar directamente rutas lazy representativas de profesor, admin, cambio
   de password y super admin para comprobar reescritura SPA, loader y guards en
   el despliegue real.

## Commit sugerido

`refactor(autenticacion): modularizar sesion y navegacion`

## Entrega final

- Última capa terminada: 7. Cierre.
- Verificación final: 19 archivos y 170 pruebas específicas; `check:deploy`
  correcto con 275 archivos, 1510 pruebas, ESLint y build de 375 módulos;
  `git diff --check` y auditorías de alcance/duplicados correctos.
- Implementaciones antiguas retiradas: transformaciones de login/password,
  decisiones duplicadas de guards, listas literales de limpieza, árboles
  desktop, matcher local de navegación y llamadas directas de los consumidores
  a los cuatro endpoints de autenticación. También se retiraron las lecturas de
  sesión y coordinación del tenant desde los componentes migrados. Los comandos
  duplicados de logout y las implementaciones de login/password en consumidores
  también fueron retirados. El markup de login, cambio de password, banner y
  navegación por rol ahora existe una sola vez en sus vistas; los componentes
  públicos intermedios ya no existen y sus raíces conectan directamente hooks
  y vistas.
- Riesgos abiertos: los registrados en la sección anterior; no se introdujeron
  correcciones funcionales.
- Siguiente capa: ninguna; módulo terminado.
- Siguiente acción exacta: el usuario revisa el diff, crea el único commit con
  el mensaje sugerido, hace push a `origin/main`, espera el deploy y ejecuta la
  verificación manual anterior. Codex no realizó commit, push ni deploy.
