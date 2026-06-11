# Checklist Produccion Frontend

Checklist tecnico basado en el estado actual documentado del frontend.

## 1. CRITICO

### Cookie de sesion en produccion

- Estado actual: el frontend ya no guarda `access_token` dentro de `localStorage.usuario` ni `localStorage.profesor`; conserva datos minimos de sesion visual y usa cookie `token`.
- Riesgo: si la cookie productiva no queda `HttpOnly`, `Secure` y con `SameSite` adecuado, JavaScript podria leerla o el navegador podria enviarla en contextos no deseados.
- Archivo afectado: `src/utils/api.js`, `src/components/LoginForm.jsx`.
- Que puede pasar en produccion: una configuracion debil de cookie podria exponer la sesion o romper login entre dominios.
- Prioridad: CRITICO.
- Como probarlo: iniciar sesion, abrir DevTools, confirmar que `localStorage.usuario` y `localStorage.profesor` no contienen `access_token`, y revisar que la cookie `token` tenga atributos productivos esperados.
- Recomendacion tecnica: mantener la sesion real en cookie HttpOnly/Secure/SameSite emitida por backend y no volver a guardar JWT en `localStorage`.

### Guards basados en datos manipulables del navegador

- Problema: `ProtectedRoute` y `AdminRoute` validan acceso con datos de `localStorage`.
- Riesgo: un usuario puede modificar manualmente `localStorage` y hacer que la UI muestre rutas que no le corresponden.
- Archivo afectado: `src/App.jsx`.
- Que puede pasar en produccion: un profesor podria ver pantallas administrativas en la UI si altera `localStorage`; el backend debe bloquear los datos reales, pero la interfaz quedaria expuesta.
- Prioridad: CRITICO.
- Como probarlo: iniciar como profesor, cambiar en DevTools `localStorage.usuario` con `{ "rol": "admin" }`, refrescar e intentar entrar a `/dashboard-admin`.
- Recomendacion tecnica: mantener guards de UI, pero revalidar sesion/rol contra backend al cargar la app y asumir que la autorizacion real siempre vive en backend.

### Tenant resuelto por cookie/JWT del backend

- Estado actual: resuelto en frontend; ya no se envia header de tenant desde
  `localStorage`.
- Riesgo residual: si algun flujo futuro vuelve a confiar en un tenant enviado
  por el navegador, se reabre el riesgo de acceso cruzado entre colegios.
- Archivo afectado: `src/utils/api.js`, `src/components/LoginForm.jsx`.
- Que puede pasar en produccion: un contrato frontend/backend ambiguo podria
  permitir que se reintroduzca un header manipulable.
- Prioridad: CRITICO.
- Como probarlo: buscar `X-Tenant-ID`, `localStorage.tenant`,
  `setItem("tenant"` y `getItem("tenant"` en `src`; no deben existir usos
  funcionales para seleccionar tenant.
- Recomendacion tecnica: mantener la fuente de verdad del tenant en la
  cookie/token validado por backend. El tenant dentro del objeto de sesion local
  es solo informativo para la UI.

### Fallback de API a localhost

- Estado: mitigado en build remoto.
- Problema: en desarrollo local el frontend puede usar `http://localhost:8000`,
  pero en despliegues remotos debe existir `VITE_API_URL`.
- Riesgo: un build de produccion mal configurado podria intentar consumir una API local inexistente.
- Archivo afectado: `src/config/env.js`, `scripts/check-env.mjs`, `.env.example`.
- Que puede pasar en produccion: la aplicacion podria quedar sin conexion al backend, con errores de red para todos los usuarios.
- Prioridad: CRITICO.
- Como probarlo: ejecutar `pnpm run build` sin `VITE_API_URL` en un build remoto o con una URL invalida.
- Recomendacion tecnica: mantener `VITE_API_URL` configurado en Vercel con la URL publica del backend en Render.

### Seguridad real dependiente del backend

- Problema: los roles, rutas protegidas y menus del frontend solo controlan la experiencia visual.
- Riesgo: cualquier endpoint llamado desde el navegador puede ser replicado manualmente con herramientas externas.
- Archivo afectado: `src/App.jsx`, `src/utils/api.js`, paginas que consumen API.
- Que puede pasar en produccion: si algun endpoint backend no valida permisos, tenant o ownership, la UI no lo impediria.
- Prioridad: CRITICO.
- Como probarlo: capturar una peticion desde DevTools, repetirla con otro ID o rol usando Postman/curl y verificar respuesta del backend.
- Recomendacion tecnica: mantener el frontend como capa de UX y auditar backend como fuente obligatoria de permisos.

## 2. IMPORTANTE

### Manejo global de errores limitado a 401

- Problema: el interceptor global solo actua ante `401`.
- Riesgo: errores `403`, `422`, `429` o `500` pueden quedar manejados de forma inconsistente por cada pagina.
- Archivo afectado: `src/utils/api.js` y paginas que llaman API.
- Que puede pasar en produccion: usuarios pueden ver mensajes confusos, pantallas sin datos o fallos silenciosos.
- Prioridad: IMPORTANTE.
- Como probarlo: simular respuestas `403`, `500` y desconexion de red en una pagina con datos.
- Recomendacion tecnica: centralizar criterios de error comunes sin quitar los mensajes especificos de cada modulo.

### Componentes y paginas grandes

- Problema: existen archivos grandes que mezclan estado, UI y llamadas API.
- Riesgo: aumenta la probabilidad de bugs al modificar funcionalidades y dificulta pruebas.
- Archivo afectado: `src/pages/EstudiantesAdmin.jsx` con 927 lineas, `src/components/cartera/AdministrarTiposPago.jsx` con 902 lineas, `src/components/AsignarClaseGrid.jsx` con 792 lineas, entre otros.
- Que puede pasar en produccion: cambios pequenos pueden romper flujos completos por acoplamiento interno.
- Prioridad: IMPORTANTE.
- Como probarlo: revisar cambios en esos archivos y ejecutar pruebas manuales completas del modulo afectado.
- Recomendacion tecnica: cuando se toque cada modulo, extraer hooks, subcomponentes y servicios por responsabilidad.

### Estado de sesion repartido en varias claves

- Problema: la sesion visual usa `usuario`, `profesor`, `super_admin`, junto
  con selecciones de trabajo como `asignacionId`, `periodo`,
  `fechaAsistencia` y `planillaTipoEvaluacion`.
- Riesgo: puede quedar estado viejo despues de cambios de usuario, logout parcial o expiracion.
- Archivo afectado: `src/components/NavAdmin.jsx`, `src/components/NavProfesor.jsx`, `src/utils/api.js`, paginas academicas.
- Que puede pasar en produccion: un usuario podria ver selecciones anteriores, periodos viejos o peticiones con contexto incorrecto.
- Prioridad: IMPORTANTE.
- Como probarlo: iniciar como profesor, seleccionar asignacion/periodo, cerrar sesion, entrar con otro usuario y revisar si queda estado anterior.
- Recomendacion tecnica: centralizar limpieza de sesion y diferenciar estado de autenticacion de estado de trabajo.

### Rutas protegidas sin verificacion asincrona inicial

- Problema: `App.jsx` decide acceso inmediatamente desde `localStorage`.
- Riesgo: una sesion expirada puede renderizar brevemente layout o menus hasta que una peticion devuelva `401`.
- Archivo afectado: `src/App.jsx`, `src/utils/api.js`.
- Que puede pasar en produccion: experiencia inconsistente, parpadeos de UI o acceso visual temporal a pantallas protegidas.
- Prioridad: IMPORTANTE.
- Como probarlo: guardar datos viejos en `localStorage`, invalidar token en backend, refrescar una ruta protegida.
- Recomendacion tecnica: agregar una fase de validacion de sesion al iniciar la app antes de renderizar rutas privadas.

### Formularios con validacion distribuida

- Problema: las validaciones de formularios viven en cada componente/pagina.
- Riesgo: reglas inconsistentes entre modulos y errores dificiles de mantener.
- Archivo afectado: `LoginForm.jsx`, `CrearEstudiante.jsx`, `CrearProfesor.jsx`, `CrearCurso.jsx`, paginas administrativas y academicas.
- Que puede pasar en produccion: datos incompletos, mensajes diferentes para el mismo error o validaciones duplicadas.
- Prioridad: IMPORTANTE.
- Como probarlo: enviar formularios vacios, formatos invalidos y valores limite en cada modulo.
- Recomendacion tecnica: documentar reglas por modulo y luego centralizar validaciones compartidas.

### Build con `dist/` generado localmente

- Estado actual: mitigado; `.gitignore` excluye `dist` y el build local no dejo
  cambios pendientes en `git status`.
- Problema: `dist/` se genera localmente durante el build y no debe tratarse
  como fuente de verdad del codigo.
- Riesgo: puede mezclarse codigo generado viejo con cambios actuales si se
  despliega manualmente fuera del flujo Vercel/CI.
- Archivo afectado: `dist/`.
- Que puede pasar en produccion: despliegues con assets desactualizados o confusion al revisar cambios.
- Prioridad: IMPORTANTE.
- Como probarlo: ejecutar `pnpm run build` y comparar si `dist/` cambia despues de modificaciones.
- Recomendacion tecnica: mantener `dist/` fuera de control de versiones y
  generarlo en Vercel/CI.

### Logs locales de desarrollo

- Estado actual: mitigado; `.gitignore` excluye `logs` y `*.log`.
- Problema: logs locales de Vite u otros comandos pueden aparecer en la raiz
  durante desarrollo.
- Riesgo: ruido en el repo y posible exposicion accidental de informacion de desarrollo si se fuerza su versionado.
- Archivo afectado: `vite-dev.out.log`, `vite-dev.err.log`.
- Que puede pasar en produccion: confusion operativa o subida accidental de logs no necesarios.
- Prioridad: IMPORTANTE.
- Como probarlo: revisar `git status` y verificar si los logs aparecen como cambios.
- Recomendacion tecnica: mantener logs fuera del control de versiones y revisar
  `git status` antes de commits.

### Lazy loading existe, pero no hay estrategia visible de precarga

- Problema: las paginas se cargan con `React.lazy`, pero no se observa una estrategia de prefetch/preload por flujo.
- Riesgo: pantallas pesadas pueden tardar al primer ingreso.
- Archivo afectado: `src/App.jsx`, paginas grandes.
- Que puede pasar en produccion: usuarios con internet lento pueden sentir demoras al entrar a modulos grandes.
- Prioridad: IMPORTANTE.
- Como probarlo: ejecutar build, abrir DevTools Network con throttling y entrar por primera vez a paginas administrativas grandes.
- Recomendacion tecnica: medir chunks reales y decidir precarga selectiva solo para rutas criticas.

## 3. OPCIONAL

### Loader generico muy basico

- Problema: `PageLoader` solo muestra `Cargando...`.
- Riesgo: en cargas lentas no informa contexto del modulo.
- Archivo afectado: `src/App.jsx`.
- Que puede pasar en produccion: experiencia menos clara en conexiones lentas.
- Prioridad: OPCIONAL.
- Como probarlo: activar throttling en DevTools y navegar entre rutas lazy.
- Recomendacion tecnica: mejorar loaders por modulo cuando se trabaje experiencia de usuario.

### Documentacion de variables por ambiente

- Estado: completado.
- Problema: los despliegues nuevos deben conocer el valor correcto de `VITE_API_URL`.
- Riesgo: si se ignora la plantilla, Vercel podria quedar apuntando a una API incorrecta.
- Archivo afectado: `.env.example`, `.env.production.example`, `docs/DEPLOY_GRATIS.md`.
- Que puede pasar en produccion: build apuntando a una API incorrecta.
- Prioridad: OPCIONAL.
- Como probarlo: preparar un entorno nuevo sin `.env` y revisar resultado de build.
- Recomendacion tecnica: usar las plantillas y la guia de deploy como fuente de verdad inicial.

### Menus y rutas definidos manualmente

- Problema: rutas en `App.jsx` y enlaces en `NavAdmin.jsx`/`NavProfesor.jsx` se mantienen por separado.
- Riesgo: una ruta puede existir sin enlace o un enlace puede quedar apuntando a una ruta removida.
- Archivo afectado: `src/App.jsx`, `src/components/NavAdmin.jsx`, `src/components/NavProfesor.jsx`.
- Que puede pasar en produccion: navegacion rota o pantallas inaccesibles desde el menu.
- Prioridad: OPCIONAL.
- Como probarlo: recorrer todos los enlaces del menu y refrescar cada ruta.
- Recomendacion tecnica: centralizar definicion de rutas y menus cuando crezca el numero de modulos.

### Versiones modernas con superficie de compatibilidad

- Problema: el proyecto usa React 19, React Router DOM 7 y Vite 8.
- Riesgo: algunas librerias o patrones antiguos pueden tener cambios de compatibilidad.
- Archivo afectado: `package.json`.
- Que puede pasar en produccion: warnings, incompatibilidades o comportamientos distintos en actualizaciones.
- Prioridad: OPCIONAL.
- Como probarlo: ejecutar `pnpm run build`, `pnpm run lint` y pruebas manuales de rutas principales despues de actualizar dependencias.
- Recomendacion tecnica: fijar estrategia de actualizacion y probar dependencias en rama separada.

### Separacion futura de servicios por dominio

- Problema: el cliente `api` es central, pero las llamadas especificas estan distribuidas en paginas y algunos servicios.
- Riesgo: crecimiento de llamadas duplicadas y manejo desigual de parametros/errores.
- Archivo afectado: paginas en `src/pages/`, componentes en `src/components/`, `src/services/printingService.js`.
- Que puede pasar en produccion: inconsistencias entre modulos al consumir endpoints parecidos.
- Prioridad: OPCIONAL.
- Como probarlo: buscar `api.get`, `api.post`, `api.put` y `api.delete` y revisar duplicados por modulo.
- Recomendacion tecnica: crear servicios por dominio cuando se refactorice cada modulo.

## Pendientes 2026-05-30 - Super admin

### Validacion manual de acceso

- Estado: pendiente.

## Cierre SaaS 2026-06-01

[ ] Login de admin inicial con password temporal redirige a `/cambiar-password`.
[ ] Cambiar password temporal con una password fuerte.
[ ] Confirmar que despues del cambio entra a `/dashboard-admin`.
[ ] Confirmar que crear colegio rechaza password temporal debil.
[ ] Confirmar que super admin muestra `estado` efectivo y `estado_manual` si
son diferentes.
- Archivo afectado: `src/App.jsx`, `src/pages/SuperAdminDashboard.jsx`.
- Como probarlo:
  - iniciar sesion con `super_admin`;
  - confirmar redireccion a `/super-admin`;
  - cerrar sesion;
  - entrar como admin/profesor y confirmar que `/super-admin` redirige a `/login`.

### Creacion de colegio desde super admin

- Estado: pendiente de prueba manual.
- Archivo afectado: `src/pages/SuperAdminDashboard.jsx`.
- Como probarlo:
  - iniciar sesion con `super_admin`;
  - hacer clic en `Crear colegio`;
  - completar colegio, admin inicial y suscripcion;
  - confirmar que aparece en la tabla;
  - cerrar sesion e iniciar con el admin inicial del colegio creado.

### Confirmacion para estados criticos

- Estado: completado.
- Problema: cambiar a `suspendido` o `cancelado` tiene impacto directo en acceso del colegio.
- Recomendacion tecnica: pedir confirmacion explicita antes de aplicar esos estados.

### Aviso de pago configurable

- Estado: pendiente.
- Problema: el banner de mora muestra mensaje general.
- Recomendacion tecnica: cuando backend tenga canales de pago, mostrar banco,
  cuenta/referencia y contacto de soporte en el aviso.
