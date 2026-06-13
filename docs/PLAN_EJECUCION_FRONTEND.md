# Plan Ejecucion Frontend

Plan de ejecucion basado en `docs/CHECKLIST_PRODUCCION_FRONTEND.md`. Este archivo no cambia codigo; ordena el trabajo futuro del frontend.

Ultima revision documental: 2026-06-13.

## 1. Seguridad frontend

- Objetivo: reducir exposicion de datos sensibles en el navegador y dejar claro que la autorizacion real viene del backend.
- Tareas:
  - Mantener cerrado el uso de `access_token` dentro de `localStorage.usuario`
    y `localStorage.profesor`.
  - Mantener la sesion real en cookie emitida por backend.
  - Mantener cerrado el envio de tenant desde `localStorage`.
  - Validar que ninguna pantalla asuma que ocultar botones equivale a permiso real.
- Archivos probables:
  - `src/utils/api.js`
  - `src/components/LoginForm.jsx`
  - `src/App.jsx`
  - paginas que consumen API.
- Riesgo: ALTO; tocar sesion/token puede romper login y consumo de API.
- Como probar:
  - Iniciar sesion como admin y profesor.
  - Revisar DevTools Storage y confirmar que el token no queda expuesto en los
    objetos `usuario`, `profesor` o `super_admin`.
  - Cambiar manualmente rol local para confirmar que backend bloquea los
    endpoints no autorizados.
  - Buscar `X-Tenant-ID`, `setItem("tenant"` y `getItem("tenant"` en `src`.
  - Probar endpoints desde la UI despues de limpiar storage.
- Cuando hacer commit:
  - Un commit despues de que login, navegacion y llamadas autenticadas funcionen con admin y profesor.

## 2. Manejo de sesion

- Objetivo: centralizar el estado de sesion y evitar restos de usuario anterior.
- Tareas:
  - Crear o consolidar una utilidad de lectura/limpieza de sesion.
  - Unificar logout de `NavAdmin.jsx` y `NavProfesor.jsx`.
  - Separar datos de autenticacion de selecciones de trabajo como `asignacionId`, `periodo`, `fechaAsistencia` y `planillaTipoEvaluacion`.
  - Agregar validacion inicial de sesion si backend expone endpoint para usuario actual.
- Archivos probables:
  - `src/components/NavAdmin.jsx`
  - `src/components/NavProfesor.jsx`
  - `src/utils/api.js`
  - `src/App.jsx`
  - paginas academicas que usan selecciones persistidas.
- Riesgo: MEDIO/ALTO; limpiar mal el storage puede sacar al usuario o perder selecciones necesarias.
- Como probar:
  - Login admin, logout, login profesor.
  - Login profesor, seleccionar asignacion/periodo, logout, login con otro profesor.
  - Refrescar rutas protegidas con token vigente y token vencido.
  - Confirmar redireccion a `/login` en `401`.
- Cuando hacer commit:
  - Despues de probar login/logout y cambio de usuario en ambos perfiles.

## 3. Roles y guards

- Objetivo: hacer que las rutas protegidas dependan de una sesion validada y no solo de datos locales manipulables.
- Tareas:
  - Revisar `ProtectedRoute` y `AdminRoute`.
  - Agregar estado de carga de sesion antes de renderizar layout protegido cuando exista endpoint backend.
  - Mantener menus por rol, pero sincronizados con rol validado.
  - Revisar paginas que tambien validan rol internamente para evitar duplicacion confusa.
- Archivos probables:
  - `src/App.jsx`
  - `src/components/NavAdmin.jsx`
  - `src/components/NavProfesor.jsx`
  - paginas administrativas con validaciones locales.
- Riesgo: ALTO; cambios en guards pueden bloquear rutas correctas o dejar rutas admin visibles.
- Como probar:
  - Entrar como admin a todas las rutas admin.
  - Entrar como profesor e intentar `/dashboard-admin`, `/admin/pagos`, `/boletin`.
  - Manipular `localStorage.usuario.rol` y refrescar.
  - Probar sesion expirada.
- Cuando hacer commit:
  - Despues de recorrer rutas principales de admin y profesor sin regresiones.

## 4. Componentes grandes

- Objetivo: reducir riesgo de mantenimiento en archivos grandes sin cambiar comportamiento.
- Tareas:
  - Empezar por un modulo a la vez.
  - Extraer subcomponentes visuales cuando no cambien reglas de negocio.
  - Extraer hooks/servicios para llamadas API repetidas.
  - Mantener nombres y flujos existentes durante la primera separacion.
- Archivos probables:
  - `src/pages/EstudiantesAdmin.jsx`
  - `src/components/cartera/AdministrarTiposPago.jsx`
  - `src/components/AsignarClaseGrid.jsx`
  - `src/pages/PagosAdmin.jsx`
  - `src/pages/CarteraVencidaAdmin.jsx`
  - `src/pages/PlaneadorAnual.jsx`
  - `src/pages/PlanDeClases.jsx`
- Riesgo: MEDIO; refactors grandes pueden romper flujos si se mezclan con cambios funcionales.
- Como probar:
  - Probar el modulo antes del refactor y anotar flujo base.
  - Probar crear, editar, eliminar, listar y filtros del modulo afectado.
  - Ejecutar build despues de cada extraccion.
- Cuando hacer commit:
  - Un commit por modulo o por extraccion pequena que compile y mantenga el flujo igual.

## 5. Performance

- Objetivo: mejorar carga inicial y navegacion sin perder funcionalidad.
- Tareas:
  - Medir chunks generados por `pnpm run build`.
  - Revisar paginas pesadas cargadas con `React.lazy`.
  - Evaluar precarga selectiva solo para rutas criticas.
  - Revisar tablas/listas grandes y coordinar paginacion con backend donde aplique.
- Archivos probables:
  - `src/App.jsx`
  - paginas administrativas grandes.
  - componentes de tablas/listados.
  - `package.json`
  - `vite.config.js` si se ajusta build.
- Riesgo: MEDIO; optimizaciones prematuras pueden complicar el codigo sin mejorar tiempos reales.
- Como probar:
  - Ejecutar `pnpm run build`.
  - Usar DevTools Network con throttling.
  - Medir primera carga, navegacion a modulos grandes y tiempo de respuesta de API.
- Cuando hacer commit:
  - Despues de medir mejora o confirmar que el cambio no empeora carga y navegacion.

## 6. Manejo de errores

- Objetivo: hacer respuestas de error consistentes y entendibles para el usuario.
- Tareas:
  - Ampliar criterio global en `api.js` para errores comunes sin borrar manejo local.
  - Revisar formularios principales y mensajes para `422`, `403`, `500` y red.
  - Diferenciar error de permisos, error de validacion y error de conexion.
  - Evitar pantallas vacias cuando una peticion falla.
- Archivos probables:
  - `src/utils/api.js`
  - `src/components/LoginForm.jsx`
  - paginas con formularios administrativos y academicos.
- Riesgo: MEDIO; un manejo global agresivo puede tapar mensajes especificos utiles.
- Como probar:
  - Credenciales invalidas.
  - Usuario sin permiso.
  - Backend apagado.
  - Formularios con datos incompletos.
  - Error 500 simulado o provocado en entorno de prueba.
- Cuando hacer commit:
  - Despues de probar errores en login y al menos un modulo admin y uno profesor.

## 7. Build produccion

- Objetivo: asegurar que el build use variables correctas y no dependa de archivos locales.
- Tareas:
  - Documentar/validar `VITE_API_URL` por ambiente.
  - Revisar que el build no use `http://localhost:8000` en produccion.
  - Mantener `dist/` fuera de control de versiones.
  - Mantener logs locales de Vite fuera de control de versiones.
  - Confirmar que `vercel.json` mantiene rutas SPA funcionando.
- Archivos probables:
  - `.env`
  - `src/utils/api.js`
  - `vercel.json`
  - `package.json`
  - `.gitignore`
- Riesgo: ALTO; un build mal configurado puede dejar la app sin API o con assets desactualizados.
- Como probar:
  - Ejecutar `pnpm run build`.
  - Ejecutar `pnpm run preview`.
  - Navegar rutas internas y refrescar.
  - Revisar Network para confirmar URL real de API.
  - Probar login contra ambiente correcto.
- Cuando hacer commit:
  - Despues de build exitoso y prueba manual de login, rutas protegidas y una ruta admin/profesor.

## Completado 2026-06-11 - UX movil admin e impresos

Objetivo cerrado:

- Mejorar la experiencia movil del perfil admin, especialmente navegacion,
  impresos y observador de estudiante.

Trabajo realizado:

- `NavAdmin` movil con grupos colapsables bajo demanda.
- Impresos de boletin, certificados y cartera con scroll lateral A4 en movil.
- Toolbar compacto de documentos con `Descargar PDF` e `Imprimir`.
- Boton `Atras` arriba en boletin y certificados para evitar superposicion.
- Diseno de impresos/plantillas adaptado para pantallas estrechas.
- Observador de estudiante desde admin reorganizado en tarjetas responsive.

Verificacion:

- `pnpm run lint`.
- `pnpm run build` ejecutado con permisos elevados por `EPERM` local conocido
  de Vite/fnm.

## Completado 2026-06-13 - UX movil profesor y etiquetas Android

Objetivo cerrado:

- Mejorar la experiencia movil del perfil profesor y evitar traducciones
  automaticas del navegador sobre etiquetas academicas.

Trabajo realizado:

- `Planilla` movil con tarjetas por estudiante.
- Promedio de planilla con color verde/rojo en movil y escritorio.
- Ocultamiento de columnas tecnicas como `mas_alto`.
- Formateo de etiquetas tecnicas de notas.
- `translate="no"` en nombres, tipos de nota, inputs y etiquetas sensibles.
- Normalizacion de coma decimal de teclado movil en notas numericas.
- `IngresoBoletinProfesor` alineado con planilla para ocultar notas internas y
  evitar traduccion automatica.
- `Asistencia` con carga/reintento de historial y aviso de asistencia ya tomada.
- `Observaciones` con tiempo limite/cancelacion para no quedar en
  `Verificando`.

Verificacion:

- `pnpm run lint` en ajustes puntuales.
- `pnpm run build` ejecutado en cambios principales cuando fue necesario; en
  local requiere permisos elevados por `EPERM` conocido de Vite/fnm.

Pendiente posible:

- Si Android real sigue sin refrescar valores de planilla en tiempo real, medir
  si el problema es cache del bundle, evento `blur` del teclado movil o
  respuesta tardia del backend antes de seguir cambiando codigo.
- Si `Observaciones` sigue lento, redisenar la pantalla para abrir/cargar un
  estudiante a la vez en vez de montar todos los formularios simultaneamente.

## Completado 2026-06-11 - Primera optimizacion dashboard profesor

Objetivo cerrado:

- Reducir bloqueo inicial del dashboard profesor sin tocar backend.

Trabajo realizado:

- Se elimino la llamada duplicada a `/mis-clases/{profesor_id}`.
- Se separaron estados de carga por seccion.
- Se removio el loader global de pantalla completa.
- Inasistencias y rendimiento cargan sin impedir que el layout principal
  aparezca.
- `notas-bajas` y `notas-altas` se ejecutan en paralelo.

Pendiente posible:

- Si el dashboard sigue lento en produccion despues de este ajuste, revisar
  backend/hosting y evaluar un endpoint consolidado como
  `GET /dashboard/profesor/{profesor_id}`.

Verificacion:

- `pnpm run lint`.
- `pnpm run build` ejecutado con permisos elevados por `EPERM` local conocido
  de Vite/fnm.

## Pendiente 2026-05-30 - Flujo super admin

Estado actual:

- La ruta `/super-admin` ya existe.
- El mismo login redirige a `/super-admin` cuando backend responde
  `rol = "super_admin"`.
- El panel lista tenants y permite cambiar estado.

Pendiente manual:

- Probar login con codigo `super_admin`.
- Confirmar que `/super-admin` no entra con `admin` ni `profesor`.
- Confirmar que `/super-admin` lista tenants.
- Crear colegio de prueba desde `/super-admin`.
- Probar login del admin inicial del colegio creado.
- Probar cambio de estado con un tenant de prueba:
  - `activo` -> `en_mora`;
  - `en_mora` -> `suspendido`;
  - `suspendido` -> `activo`.
- Confirmar que el banner de mora aparece en layout de admin/profesor cuando
  el tenant esta `en_mora`.

Pendiente UX:

- Mejorar el mensaje del banner de mora cuando existan canales de pago reales.
- Agregar campo de busqueda/filtro si crece el numero de tenants.

Completado despues:

- Confirmacion antes de cambiar estado de tenant.
- Motivo obligatorio para `suspendido` y `cancelado`.
- Consulta de historial de cambios por tenant desde el panel.
- Creacion de colegio desde el panel con admin inicial y suscripcion.
