# Rutas Frontend

Estado actual de rutas definido en `src/App.jsx`.

Ultima revision documental: 2026-10-26.

## Rutas publicas

| Ruta | Componente | Observacion |
| --- | --- | --- |
| `/` sin sesion | `Landing` | Portada publica (desde el 2026-10-26). Con sesion, `/` es el panel del profesor. |
| `/login` | `Login` | Pantalla de acceso. |
| `/cambiar-password` | `CambiarPassword` | `PasswordChangeRoute`: solo admin con `debe_cambiar_password = true`. |

`/cambiar-password` es una ruta superior fuera del layout autenticado normal.
Si no existe `localStorage.usuario` con rol `admin`, redirige a `/login`; si el
admin ya no tiene cambio obligatorio, redirige a `/dashboard-admin`.

La landing no tiene ruta propia: el layout `/*` la muestra en `/` cuando no hay
sesion, en vez de mandar al login. Sus botones "Ingresar" llevan a `/login`. No
consulta el backend ni monta nada del layout (menu, avisos, tenant).

## Rutas dentro del layout autenticado

El layout `/*` valida que exista `usuario` o `profesor` en `localStorage`. Sin
sesion, `/` muestra la landing y cualquier otra ruta redirige a `/login`.

| Ruta | Componente | Guard |
| --- | --- | --- |
| `/` | `DashboardProfesor` | `ProtectedRoute` |
| `/planilla` | `Planilla` | `ProtectedRoute` |
| `/Formulario` | redirige a `/observador` | — (oculta el 2026-09-10) |
| `/observador` | `Observador` | `ProtectedRoute` |
| `/asistencia` | `Asistencia` | `ProtectedRoute` |
| `/ranking-rendimiento` | `RankingRendimiento` | `ProtectedRoute` |
| `/ranking-mejor-rendimiento` | `RankingMejorRendimiento` | `ProtectedRoute` |
| `/plan-de-clases` | `PlanDeClases` | `ProtectedRoute` |
| `/planeador-anual` | `PlaneadorAnual` | `ProtectedRoute` |
| `/ingreso-boletin` | `IngresoBoletinProfesor` | `ProtectedRoute` |

## Rutas administrativas

Estas rutas usan `AdminRoute`, que revisa `localStorage.usuario.rol === "admin"`.

| Ruta | Componente |
| --- | --- |
| `/dashboard-admin` | `AdminDashboard` |
| `/admin/anios-lectivos` | `AniosLectivosAdmin` |
| `/admin/anios-lectivos/admisiones` | `AdmisionesAdmin` |
| `/admin` | `Admin` |
| `/admin/pagos` | `PagosAdmin` |
| `/admin/tipos-pagos` | `TiposPagosAdmin` |
| `/admin/cartera-vencida` | `CarteraVencidaAdmin` |
| `/admin/inventario` | `InventarioAdmin` |
| `/admin/ventas` | `VentasAdmin` |
| `/admin/egresos` | `EgresosAdmin` |
| `/admin/prestamos` | `PrestamosAdmin` |
| `/admin/nomina` | `NominaAdmin` |
| `/admin/estudiantes` | `EstudiantesAdmin` |
| `/admin/reportes` | `ReportesAdmin` |
| `/admin/horarios` | `HorariosAdmin` |
| `/admin/planeadores-clases` | `PlaneadoresClasesAdmin` |
| `/admin/planeadores-clases/:planId` | `PlaneadoresClasesAdmin` |
| `/admin/certificados` | `CertificadosAdmin` |
| `/admin/diseno-impresos` | `BrandingAdmin` |
| `/admin/listas-seguimiento` | `ListasSeguimientoAdmin` |
| `/boletin` | `Boletin` |

`/admin` guarda su pestaña en la dirección desde el 2026-10-03 (año lectivo,
fase 4, paso 4.2): `/admin?modulo=profesores`, `cursos`, `materias`,
`asignar-clases` u `orden-boletin`. Sin `modulo`, o con uno desconocido, abre
Profesores, como antes. Cambiar de pestaña reemplaza la dirección, así que no
suma pasos al botón Atrás. Motivo: la pestaña sobrevive cuando la página se
reinicia al cambiar de año, y la barra sabe si la pestaña abierta depende del
año (ver `docs/funcionalidades/ANIO_LECTIVO.md`).

`/admin/anios-lectivos` es la pantalla base de preparación del siguiente año
(fase 5, paso 5.7). Solo el admin puede abrirla. Crear y copiar no dependen del
selector general: el backend valida el destino. Sus enlaces a Cursos y Tipos
de pago seleccionan primero el año en preparación.

`/admin/anios-lectivos/admisiones` (2026-10-13, entrevista de admisión, paso
E4) es la página de admisiones: aspirantes nuevos del año en preparación, su
entrevista y su resultado. Se llega desde la tarjeta "Admisiones {año}" de
Años lectivos y no tiene entrada propia en el menú. Trabaja siempre con el año
en preparación, no con el del selector (que aquí no aparece: no está en
`RUTAS_POR_ANIO`). Sin año en preparación, dice cómo crearlo. Ver
`docs/funcionalidades/ENTREVISTA_ADMISION.md`.

## Rutas de super admin

Esta ruta usa `SuperAdminRoute`, que revisa `localStorage.super_admin.rol === "super_admin"`.

| Ruta | Componente |
| --- | --- |
| `/super-admin` | `SuperAdminDashboard` |

## Navegacion de administrador

El menú lateral (`MenuLateralView`, con `ADMIN_DESKTOP_ITEMS` de
`src/utils/autenticacion/navegacion.js`) muestra enlaces a:

- Dashboard admin.
- Estructura académica.
- Años lectivos.
- Horarios.
- Planeadores de clases.
- Certificados.
- Boletin.
- Diseno de impresos.
- Listas de Seguimiento.
- Pagos.
- Tipos de pagos.
- Cartera vencida.
- Inventario.
- Ventas.
- Egresos.
- Prestamos.
- Nomina.
- Estudiantes.
- Reportes.

Los grupos (Gestión Académica, Cartera, Administración) se abren con clic, y
el de la página actual ya viene abierto; en el riel, sus páginas salen en un
panel al lado. Administración contiene Estructura académica (`/admin`) y Años
lectivos (`/admin/anios-lectivos`). Las páginas de un grupo van indentadas,
sin ícono, para no confundirse con las entradas principales. En celular, el
mismo menú se desliza desde la izquierda.

La opcion `Nómina` esta marcada con `translate="no"` para evitar que navegadores
moviles la traduzcan como `nombre`.

Notas de UX por ruta admin:

- `/boletin`: el boletin imprimible usa ancho A4 con scroll lateral en movil y
  boton `Atras` arriba a la izquierda.
- `/admin/certificados`: certificado de notas y certificado de matricula usan
  ancho A4 con scroll lateral en movil y boton `Atras` arriba a la izquierda.
- `/admin/cartera-vencida`: los reportes imprimibles por estudiante y por curso
  usan ancho A4 con scroll lateral en movil.
- `/admin/estudiantes`: el modal de detalle organiza el observador en tarjetas
  legibles en movil.
- `/admin/diseno-impresos`: tabs y controles de plantillas se ajustan para uso
  en pantallas estrechas.
- `/admin/planeadores-clases`: bandeja completa y paginada de planeaciones.
- `/admin/planeadores-clases/:planId`: detalle directo, revision y
  observaciones de una planeacion; es el destino de la campana administrativa.
- `/admin/listas-seguimiento`: grilla por curso, **no** es documento A4. Usa
  el ancho del `main` de `App.jsx` -1600 px centrados, con su padding- como
  todas las demas pantallas: no se pone ancho ni margenes laterales propios.
  Nacio con un `max-w-7xl px-4` propio, que la estrechaba a 1280 y duplicaba
  el margen; se quito el 2026-09-22. **Desde el 2026-10-07 muestra la misma
  tabla en todos los anchos**, a pedido del usuario; antes eran tarjetas por
  alumno hasta 1024 px. En el celular la tabla se desliza de lado con el
  numero y el nombre fijos a la izquierda, y por debajo de 640 px la columna
  del nombre va mas angosta y en renglones, para dejar sitio a las casillas.
  Comprobado con capturas a 360, 390 y 1024 px el 2026-10-07. Al cambiar de
  curso con marcas sin guardar, la pantalla avisa antes de descartarlas. La casilla "Crear en todos los cursos" **no se desmarca sola**
  despues de crear, para poder dar de alta varias seguidas; a cambio el texto
  del boton dice siempre en que modo esta, para que nadie cree en 25 cursos
  creyendo que crea en uno. La barra de guardado **flota pegada al borde
  inferior** mientras se desplaza la lista: es hija directa de la pantalla y no
  de un envoltorio -un elemento `sticky` solo puede moverse dentro de su
  contenedor, y uno de su mismo alto lo deja sin sitio-, y va por encima de las
  columnas congeladas de la tabla, que se pintarian sobre ella. Tiene ademas
  un boton **"Imprimir lista en blanco"** que reemplaza la pantalla por una
  vista previa A4 -la unica parte de esta pantalla con ancho fijo, porque un
  impreso no es una pantalla- con el titulo "Listas de control", el curso y la
  rejilla **sin las marcas**, para llenarla a mano. El boton solo aparece si
  hay curso, columnas y alumnos. Usa el tipo de impreso `reporte_estudiante`,
  igual que Cartera Vencida, y registra el modificador
  `di-documento--listas` en `print.css` y en `DocumentoImprimible`.

## Navegacion de profesor

El menú lateral (`MenuLateralView`, con `PROFESOR_DESKTOP_ITEMS` de
`src/utils/autenticacion/navegacion.js`) muestra enlaces a:

- Dashboard.
- Control Academico (título, sin abrir ni cerrar):
  - Planilla.
  - Asistencia.
- Planeacion Academica (título):
  - Plan de clases.
  - Planeador anual / Malla Curricular.
- Observador (`/observador`), **entrada suelta**: es una pantalla por
  estudiante, no una tarea de la clase elegida.
- Ingreso de boletin.

En celular, abajo van Dashboard, Planilla, Asistencia y Observador
(`PROFESOR_BARRA_INFERIOR`); «Más» abre Plan de clases, Malla Curricular,
Boletín Final y «Cerrar sesión».

Notas de UX por ruta profesor:

- `/planilla`: en movil usa tarjetas por estudiante; desde 600 px de ancho
  (tablets y escritorio) conserva tabla. El promedio se colorea verde/rojo
  segun umbral `3.0`.
- `/asistencia`: muestra carga/reintento del historial y aviso si la asistencia
  del dia ya fue tomada.
- `/Formulario`: **oculta desde el 2026-09-10**. Salio del menu -escritorio y
  movil- y ahora redirige a `/observador`, para que quien tuviera la direccion
  guardada llegue a donde queria ir. Su codigo sigue entero: retirarlo es la
  fase 4.
- `/observador`: bitacora acumulativa por estudiante. Lista solo nombres con una
  peticion, y pide la bitacora del alumno **al abrirlo**, no antes. Convive con
  `/Formulario` hasta que el usuario ordene retirarla. Ver
  `docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md`.
- `/plan-de-clases?asignacion_id=<id>&fecha=<AAAA-MM-DD>&plan_id=<id>&observaciones=1`:
  enlace de la campana del profesor; selecciona el plan exacto y abre su
  historial para confirmar la lectura de las observaciones.
- `/ingreso-boletin`: oculta notas internas como `mas_alto` y protege tipos de
  nota con `translate="no"`.

## Navegacion de super admin

`src/components/autenticacion/NavSuperAdminView.jsx` muestra enlace a:

- Tenants.

## Reescritura SPA

`vercel.json` contiene una regla que redirige cualquier ruta hacia `index.html`, necesaria para rutas internas de React Router en despliegues tipo SPA.
