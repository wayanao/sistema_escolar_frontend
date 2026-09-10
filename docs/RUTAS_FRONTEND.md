# Rutas Frontend

Estado actual de rutas definido en `src/App.jsx`.

Ultima revision documental: 2026-08-08.

## Rutas publicas

| Ruta | Componente | Observacion |
| --- | --- | --- |
| `/login` | `Login` | Pantalla de acceso. |
| `/cambiar-password` | `CambiarPassword` | `PasswordChangeRoute`: solo admin con `debe_cambiar_password = true`. |

`/cambiar-password` es una ruta superior fuera del layout autenticado normal.
Si no existe `localStorage.usuario` con rol `admin`, redirige a `/login`; si el
admin ya no tiene cambio obligatorio, redirige a `/dashboard-admin`.

## Rutas dentro del layout autenticado

El layout `/*` valida que exista `usuario` o `profesor` en `localStorage`.

| Ruta | Componente | Guard |
| --- | --- | --- |
| `/` | `DashboardProfesor` | `ProtectedRoute` |
| `/planilla` | `Planilla` | `ProtectedRoute` |
| `/Formulario` | `Formulario` | `ProtectedRoute` |
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
| `/boletin` | `Boletin` |

## Rutas de super admin

Esta ruta usa `SuperAdminRoute`, que revisa `localStorage.super_admin.rol === "super_admin"`.

| Ruta | Componente |
| --- | --- |
| `/super-admin` | `SuperAdminDashboard` |

## Navegacion de administrador

`src/components/autenticacion/NavAdminView.jsx` muestra enlaces a:

- Dashboard admin.
- Administracion academica.
- Horarios.
- Planeadores de clases.
- Certificados.
- Boletin.
- Diseno de impresos.
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

En movil, `NavAdminView` separa enlaces principales de grupos colapsables. Al abrir
el menu no se despliegan todas las subpestanas: el usuario selecciona el grupo
correspondiente, por ejemplo Gestion Academica o Cartera, y entonces se muestran
sus subenlaces. Los subenlaces usan estilo indentado/diferenciado para no
confundirse con las pestañas principales.

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

## Navegacion de profesor

`src/components/autenticacion/NavProfesorView.jsx` muestra enlaces a:

- Dashboard.
- Control Academico:
  - Planilla.
  - Asistencia.
  - Observaciones (`/Formulario`), la pantalla vieja.
  - Observador (`/observador`), la bitacora por estudiante.
- Planeacion Academica:
  - Plan de clases.
  - Planeador anual / Malla Curricular.
- Ingreso de boletin.

Notas de UX por ruta profesor:

- `/planilla`: en movil usa tarjetas por estudiante; en escritorio conserva
  tabla. El promedio se colorea verde/rojo segun umbral `3.0`.
- `/asistencia`: muestra carga/reintento del historial y aviso si la asistencia
  del dia ya fue tomada.
- `/Formulario`: monta el Observador del estudiante; la verificacion inicial no
  debe quedarse indefinidamente en `Verificando`. Es la pantalla **vieja**: una
  peticion por alumno visible, y por eso tarda.
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
