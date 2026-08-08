# Plan maestro de modularización frontend

Hoja de ruta para migrar el frontend por módulos y capas sin cambiar el
comportamiento funcional existente.

Última revisión: 2026-08-04.

## Objetivo

Extender al resto del frontend los límites arquitectónicos aplicados en
planeaciones:

- servicios para transporte HTTP;
- utilidades puras para contratos y transformaciones;
- hooks para estado, efectos, consultas y comandos;
- componentes para presentación;
- páginas como raíces de composición;
- pruebas junto a las unidades que protegen;
- documentación y verificación al cerrar cada capa.

## Alcance y límites

Este plan es una migración arquitectónica.

Puede crear carpetas, servicios, hooks, utilidades, componentes, pruebas y
documentación, pero el contenido debe provenir del comportamiento existente.

Queda fuera del alcance de una modularización, salvo autorización explícita:

- funciones nuevas de producto;
- endpoints o cambios de base de datos;
- rediseños visuales;
- cambios de rutas;
- cambios de roles o permisos;
- modificaciones silenciosas de reglas de negocio;
- correcciones no relacionadas con el módulo activo.

Si aparece un defecto o una mejora deseable, se documenta y se atiende en una
tarea o commit separado.

## Estado de referencia

El flujo de planeaciones es la referencia arquitectónica.

- Servicios: `src/services/planeacionesApi.js`.
- Utilidades: `src/utils/planeaciones/`.
- Hooks: `src/hooks/planeaciones/`.
- Componentes: `src/components/planeaciones/`.
- Composición: `src/pages/PlanDeClases.jsx` y
  `src/pages/PlaneadoresClasesAdmin.jsx`.
- Verificación registrada: 98 pruebas, lint y build correctos.
- Commit de referencia: `fd9ed72`.

Planeaciones y este plan maestro quedaron publicados juntos en `main`. Ese
commit constituye la línea base del primer módulo pendiente.

## Arquitectura objetivo

La convención física se crea solo cuando el módulo la necesita:

```text
src/
├── components/
│   └── <modulo>/
├── hooks/
│   └── <modulo>/
├── services/
│   └── <modulo>Api.js
├── utils/
│   └── <modulo>/
└── pages/
    └── PaginaDeComposicion.jsx
```

No se crean carpetas vacías ni archivos de plantilla dentro de `src`.

El código compartido permanece fuera del módulo únicamente cuando es usado por
dos o más dominios y su contrato realmente es común. No se generaliza código
por anticipado.

## Responsabilidad de cada capa

### Capa 0: contrato y protección inicial

- Inventariar páginas, componentes, endpoints, rutas y almacenamiento local.
- Identificar roles, estados visuales y comportamiento responsive.
- Registrar invariantes que no pueden cambiar.
- Crear pruebas de caracterización para los flujos de mayor riesgo.
- Ejecutar la verificación inicial y guardar su resultado.

Salida esperada:

- alcance delimitado;
- comportamiento protegido;
- riesgos conocidos;
- ninguna migración estructural todavía.

### Capa 1: utilidades puras

- Extraer constantes y estados iniciales.
- Normalizar respuestas.
- Construir parámetros y payloads.
- Extraer formateadores y validaciones puras.
- Agregar pruebas unitarias.

Una utilidad pura no realiza HTTP, no usa React, no accede al DOM y no modifica
almacenamiento.

### Capa 2: servicio HTTP

- Centralizar rutas del backend.
- Encapsular parámetros, payloads, multipart y señales de cancelación.
- Devolver datos o propagar errores sin decidir mensajes visuales.
- Agregar pruebas del contrato HTTP.

Las páginas, componentes y hooks del módulo dejan de importar directamente
`utils/api.js`.

### Capa 3: hooks de consulta

- Carga inicial y recargas.
- Filtros, búsqueda, debounce y paginación.
- Sincronización necesaria con URL o almacenamiento.
- Cancelación y descarte de respuestas antiguas.
- Estados controlados de carga y error.

### Capa 4: hooks de comandos y formularios

- Estado editable.
- Guardado, actualización y eliminación.
- Confirmaciones y progreso.
- Recuperación ante errores y conflictos.
- Coordinación de resultados con la interfaz.

Los hooks coordinan; el servicio conserva el transporte.

### Capa 5: componentes presentacionales

- Formularios y controles.
- Tablas, tarjetas y vistas móviles.
- Estados vacío, carga y error.
- Modales, impresos y paneles.
- Accesibilidad y callbacks mediante props.

Un componente presentacional no conoce endpoints ni administra el estado de
dominio que corresponde a un hook.

### Capa 6: consolidación de la página

La página queda dedicada a:

- leer rutas y parámetros superiores;
- conectar hooks con componentes;
- conservar navegación;
- componer la pantalla.

No debe contener endpoints, grandes transformaciones ni bloques visuales
extensos.

### Capa 7: cierre

- Ejecutar pruebas específicas.
- Ejecutar `pnpm run check:deploy`.
- Ejecutar `git diff --check`.
- Confirmar que no se modificaron otros módulos.
- Actualizar el documento del módulo.
- Actualizar `ARQUITECTURA_FRONTEND.md`, `COMPONENTES.md` y
  `CAMBIOS_FRONTEND.md` solo al cerrar una capa real.
- Registrar commit o commits.

No todos los módulos necesitan todas las capas. Una capa omitida se marca como
`No aplica` y se explica la razón.

## Criterios de aceptación por capa

Una capa se considera terminada únicamente si:

- conserva comportamiento, rutas, textos y diseño salvo alcance explícito;
- sus pruebas específicas pasan;
- lint no agrega errores;
- el build sigue siendo válido cuando el riesgo lo requiere;
- no deja implementaciones antiguas duplicadas;
- actualiza el documento del módulo;
- tiene un punto de recuperación claro en Git.

## Definición de módulo terminado

Un módulo está terminado cuando:

- no existen llamadas HTTP directas en sus páginas o componentes, salvo una
  excepción documentada;
- las transformaciones de dominio están fuera de React y tienen pruebas;
- consultas y comandos remotos están detrás de servicios y hooks;
- los componentes reciben datos y acciones mediante contratos claros;
- la página funciona como raíz de composición;
- los flujos críticos tienen pruebas;
- `pnpm run check:deploy` es correcto;
- la documentación global está sincronizada;
- el módulo tiene commit independiente y el working tree queda limpio.

## Estrategia de Git

El flujo oficial del proyecto trabaja directamente sobre `main`:

```text
main limpio y actualizado
→ modularizar un solo módulo
→ verificar
→ crear un commit del módulo
→ push a origin/main
→ deploy de producción
→ verificación manual
```

Antes de comenzar un módulo:

1. Confirmar `git status` limpio.
2. Confirmar que `main` contiene el último commit publicado.
3. Confirmar `pnpm run check:deploy` correcto.
4. Registrar el commit base en el documento del módulo.
5. No incluir archivos de otro dominio.

Durante el módulo:

- trabajar localmente sobre `main` sin publicar capas incompletas;
- ejecutar pruebas específicas al cerrar cada capa;
- actualizar el documento del módulo para conservar continuidad entre chats;
- detenerse al cerrar cada capa y esperar la orden explícita del usuario antes
  de iniciar la siguiente;
- no mezclar correcciones, mejoras funcionales ni otros dominios;
- no crear el commit final mientras quede una capa requerida pendiente.

Al terminar:

1. Actualizar documentación específica y global.
2. Ejecutar `pnpm run check:deploy`.
3. Ejecutar `git diff --check`.
4. Revisar `git status` y confirmar que el diff pertenece solo al módulo.
5. Crear un único commit, por ejemplo:
   `refactor(asistencia): modularizar el flujo completo`.
6. Ejecutar `git push origin main`.
7. Esperar el deploy y realizar la verificación manual de producción.
8. Si producción falla, corregir con un commit nuevo. No reescribir ni forzar
   el historial publicado.
9. Confirmar que el working tree queda limpio antes del siguiente módulo.

Codex no debe crear commits, hacer push ni desplegar salvo que el usuario lo
autorice explícitamente. Su entrega normal deja el módulo implementado,
documentado y verificado para que el usuario ejecute el commit y la publicación.

## Estrategia de chats

La unidad de trabajo es un módulo. Cada chat debe leer:

1. este archivo;
2. el documento del módulo;
3. únicamente los archivos fuente relacionados;
4. referencias globales adicionales solo cuando sean necesarias.

No es obligatorio leer el historial completo de `CAMBIOS_FRONTEND.md` para
iniciar un módulo.

Prompt recomendado:

```text
Lee docs/modularizacion/README.md y
docs/modularizacion/<MODULO>.md.

Trabaja únicamente en <MODULO>.
Verifica primero que estamos en main, que el working tree está limpio y que el
commit base coincide con el documento. Si no coincide, informa y no mezcles
cambios anteriores.

Trabaja únicamente en la primera capa pendiente. Al terminarla, ejecuta sus
pruebas específicas, actualiza el documento del módulo y detente. No inicies la
siguiente capa hasta que yo lo ordene explícitamente.
Esta es una migración arquitectónica: conserva diseño, textos, rutas,
comportamiento y contratos del backend.
No agregues funciones nuevas ni corrijas asuntos ajenos.
No modifiques otros módulos.

Agrega pruebas proporcionales al riesgo y actualiza el documento del módulo al
cerrar la capa. Si esta es la última capa del módulo, ejecuta además
pnpm run check:deploy y git diff --check.

No hagas commit, push ni deploy.
Déjame un resumen de la capa terminada, sus verificaciones y la siguiente capa
pendiente. Cuando se complete la última capa, déjame el módulo listo para que
yo haga un único commit y lo publique en producción.
```

La versión extensa lista para copiar se conserva en
[PROMPT_INICIO_MODULO.md](./PROMPT_INICIO_MODULO.md).

Si un módulo grande necesita varios chats, el documento del módulo debe
registrar al final:

- última capa terminada;
- verificación ejecutada;
- archivos pendientes;
- riesgos abiertos;
- siguiente acción exacta.

## Orden de migración

| Orden | Módulo | Estado | Documento |
|---:|---|---|---|
| Referencia | Planeaciones | Terminado en `fd9ed72` | Documentación global existente |
| 1 | Asistencia | Terminado; commit pendiente | [ASISTENCIA.md](./ASISTENCIA.md) |
| 2 | Planilla | Terminado; commit pendiente | [PLANILLA.md](./PLANILLA.md) |
| 3 | Malla curricular | Terminado; commit pendiente | [MALLA_CURRICULAR.md](./MALLA_CURRICULAR.md) |
| 4 | Boletines | Terminado; commit pendiente | [BOLETINES.md](./BOLETINES.md) |
| 5 | Estudiantes y observador | Terminado; commit pendiente | [ESTUDIANTES_OBSERVADOR.md](./ESTUDIANTES_OBSERVADOR.md) |
| 6 | Certificados e impresión | Terminado; commit pendiente | [CERTIFICADOS_IMPRESION.md](./CERTIFICADOS_IMPRESION.md) |
| 7 | Pagos | Terminado; commit pendiente | [PAGOS.md](./PAGOS.md) |
| 8 | Cartera y tipos de pago | Terminado; commit pendiente | [CARTERA_TIPOS_PAGO.md](./CARTERA_TIPOS_PAGO.md) |
| 9 | Reportes financieros | Pendiente | [REPORTES_FINANCIEROS.md](./REPORTES_FINANCIEROS.md) |
| 10 | Inventario y ventas | Terminado; commit pendiente | [INVENTARIO_VENTAS.md](./INVENTARIO_VENTAS.md) |
| 11 | Nómina, egresos y préstamos | Terminado; commit pendiente | [NOMINA_EGRESOS_PRESTAMOS.md](./NOMINA_EGRESOS_PRESTAMOS.md) |
| 12 | Dashboards y rankings | Pendiente | [DASHBOARDS.md](./DASHBOARDS.md) |
| 13 | Administración académica y horarios | Terminado; commit pendiente | [ADMINISTRACION_ACADEMICA.md](./ADMINISTRACION_ACADEMICA.md) |
| 14 | Autenticación, sesión y navegación | Pendiente | [AUTENTICACION_NAVEGACION.md](./AUTENTICACION_NAVEGACION.md) |

El orden puede cambiar por una necesidad funcional, pero debe modificarse aquí
antes de iniciar el nuevo módulo.

## Reglas de coordinación entre módulos

- Un módulo no mueve archivos de otro módulo.
- Una dependencia compartida se documenta antes de extraerla.
- Si dos módulos requieren el mismo cambio base, se crea primero una tarea
  transversal pequeña y verificable.
- Los contratos del backend no se reinterpretan durante el refactor.
- Las mejoras responsive se conservan; no se rediseñan dentro de una
  modularización.
- Los archivos de pruebas se colocan junto a la unidad cuando sea práctico.
- La documentación específica es la fuente de continuidad entre chats.

## Plantilla

Los nuevos documentos o subdivisiones deben partir de
[PLANTILLA_MODULO.md](./PLANTILLA_MODULO.md).
