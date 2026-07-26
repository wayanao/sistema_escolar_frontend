# Componentes

Estado actual de componentes y paginas del frontend.

## Componentes principales

- `Login.jsx`: acceso inmersivo y responsive de Auligo. Usa la fotografia
  institucional original como fondo y mejora su integracion mediante filtros y
  capas CSS, sin alterar las personas de la imagen. Presenta el eslogan oficial
  `Tu aula, tu camino, tu futuro.` y concentra el formulario en una tarjeta de
  cristal translucido con desenfoque y contraste de lectura.
- `LoginForm.jsx`: formulario de acceso con identidad visual de Auligo; consume
  `/login`, valida los campos requeridos, permite mostrar u ocultar la
  contrasena, muestra respuesta inmediata al enviar, bloquea envios duplicados
  y avisa cuando la conexion tarda mas de lo esperado. El encabezado usa el
  logotipo completo transparente; los campos incluyen contenedores de iconos,
  foco morado y correccion visual del autocompletado, y el boton principal usa
  degradado con indicador de avance.
- `NavAdmin.jsx`: menu principal para usuario admin; en movil agrupa secciones,
  usa etiquetas principales mas legibles, muestra solo la marca mas visible en
  un encabezado compacto, protege etiquetas como `Nómina` con
  `translate="no"` y mantiene visible la campana de planeaciones.
- `NavProfesor.jsx`: menu principal para profesor; en movil separa control
  academico y planeacion, con etiquetas principales mas legibles, encabezado
  compacto con solo la marca visible y campana para observaciones nuevas.
- `NotificacionesPlaneadores.jsx`: campana compartida por admin y profesor.
  Consulta `GET /notificaciones/planeadores`, muestra contador y hasta ocho
  pendientes para profesor; en admin consulta hasta veinte envíos recientes y
  recibe un resumen por docente. Cada tarjeta muestra la cantidad total y abre
  directamente la bandeja `Todas + Pendiente`, filtrada con el identificador
  exacto del profesor; ya no despliega las clases dentro de la campana. Se
  refresca cada 60 segundos/foco/evento local. La notificacion administrativa
  permanece hasta aprobar o solicitar un ajuste; una observacion del profesor
  no se marca como leida hasta abrir su historial.
- `DesktopAnimatedNav.jsx`: nav compartido de escritorio para admin/profesor;
  usa indicador animado medido por elemento activo/hover, sin depender de
  `nth-child` ni de una cantidad fija de pestañas. Las pestañas principales de
  escritorio usan `15px` para mejorar lectura.
- `NavSuperAdmin.jsx`: menu principal para super admin de plataforma.
- `NavAdmin.jsx`, `NavProfesor.jsx` y `NavSuperAdmin.jsx` muestran el logotipo
  transparente de `Auligo` en lugar del texto `Scholarix`; la marca conserva su
  enlace al inicio correspondiente de cada perfil. Sus elementos verdes usan
  mayor brillo y saturacion para conservar contraste sobre el navbar. Una
  sombra visible aplicada al contorno y un brillo discreto le dan profundidad
  aun sin interaccion, sin agregar una tarjeta o fondo.
- `index.html` declara el favicon de Auligo en formatos ICO, PNG de `16x16` y
  `32x32`, ademas del icono Apple de `180x180`. Usa una `A` morada minimalista
  sobre tarjeta blanca redondeada, sin elementos adicionales ni contorno de
  color, y con exterior transparente.
- `TenantStatusBanner.jsx`: aviso global cuando el backend marca el tenant como `en_mora`.
- `ImagenProtegida.jsx`: carga imagenes protegidas usando el cliente `api` y `responseType: "blob"`.
- `AsignarClase.jsx` y `AsignarClaseGrid.jsx`: asignacion de clases.
  `AsignarClase.jsx` no selecciona un curso por defecto al cargar; el admin
  debe escoger `Seleccionar curso` para fijar el contexto de trabajo.
- `CrearCurso.jsx`: creacion/gestion relacionada con cursos.
- `CrearEstudiante.jsx`: creacion/gestion relacionada con estudiantes.
- `CrearMateria.jsx`: creacion/gestion relacionada con materias.
- `CrearProfesor.jsx`: creacion/gestion relacionada con profesores.
- `OrdenBoletin.jsx`: orden responsive de materias por curso para impresion
  de boletines.
- `HorariosProfesores.jsx`: vista de horarios por profesor.
- `HorariosPorCurso.jsx`: vista de horarios por curso.
- `FacturaModerna.jsx`: componente de factura.
- `PlanillaRow.jsx`: fila de planilla.
- `AsistenciaRow.jsx`: fila de asistencia; muestra botones presente/ausente y
  contador de inasistencias cuando el historial ya cargo.
- `Observaciones.jsx`: manejo de observaciones; su verificacion inicial usa
  cancelacion con tiempo limite para no dejar el badge en `Verificando`
  indefinidamente. Permite guardar con una sola dimension diligenciada,
  muestra spinner durante la peticion y confirma el resultado con SweetAlert2.
- `ReporteEstudiante.jsx`: reporte individual de estudiante.
- `dashboard/CumpleanosSemana.jsx`: panel reutilizable para mostrar cumpleaños
  de estudiantes de los proximos 7 dias en dashboards con estados de carga,
  error y lista vacia.

## Dashboard admin

- `pages/AdminDashboard.jsx`: panel inicial del perfil admin en
  `/dashboard-admin`.
- El encabezado saluda con `Hola`, primer nombre del admin en negrita y una
  frase corta de inicio de labor al lado del nombre.
- La card destacada de cartera mantiene su presencia visual original.
- Las cards principales de pagos, estudiantes, gestion academica y reportes son
  accesos compactos con fondo tintado, franja lateral de color, burbuja visual
  suave y elevacion en hover/focus.
- Debajo de las cards muestra `Cumpleaños de la semana` consumiendo
  `/dashboard/cumpleanos/admin?dias=7`.
- La animacion respeta `prefers-reduced-motion` y no cambia rutas, permisos ni
  carga de datos.
- Este cambio no aplica al dashboard profesor ni a la pagina academica
  `pages/Admin.jsx`.

## Dashboard profesor

- `pages/DashboardProfesor.jsx`: panel inicial del perfil profesor.
- El encabezado saluda con `Hola`, primer nombre del profesor en negrita y una
  frase corta para iniciar la jornada docente al lado del nombre.
- Muestra `Cumpleaños de la semana` con estudiantes activos de cursos
  asignados al profesor, consumiendo
  `/dashboard/cumpleanos/profesor/{profesor_id}?dias=7`.
- Carga `GET /mis-clases/{profesor_id}` una sola vez y reutiliza esa respuesta
  para selector de clases y horario semanal.
- El bloque `Contexto de trabajo` conserva los selectores nativos de clase y
  periodo junto con la fecha, pero los presenta en una tarjeta responsive con
  controles tactiles, foco visible y estados de carga o lista vacia.
- Al seleccionar una clase, debajo del control principal aparece un selector
  de las cinco planeaciones más recientes de esa materia y curso. La consulta
  es independiente, limitada y reutiliza una caché temporal por asignación;
  elegir una opción abre el plan de la fecha correspondiente directamente en
  `Presentación de clase`, una vez terminada la carga de sus datos.
- El bloque termina al finalizar los controles; no repite la clase seleccionada
  en un resumen inferior. La opcion general conserva el valor vacio usado por
  los filtros existentes.
- Clase, periodo y fecha usan respectivamente fondos morado, verde y azul para
  corresponder con sus iconos. El selector de clase no agrega indicadores junto
  a la flecha; las opciones nativas conservan el simbolo de jornada.
- La distribucion usa una columna en movil, dos en tablet y da mayor espacio a
  la clase en escritorio.
- El horario semanal se divide en jornada mañana y tarde. Cuando existen ambas,
  ofrece el filtro `Ambas | Mañana | Tarde`; cuando solo existe una, la muestra
  directamente.
- Los selectores muestran la jornada y deduplican las clases por `curso_id` y
  materia para no mezclar cursos homonimos.
- La pantalla ya no depende de un `loading` global. Cada bloque muestra su
  propio estado de carga:
  - horario/clases;
  - ranking de inasistencias;
  - rendimiento bajo y alto.
- Las consultas de rendimiento bajo y alto se ejecutan en paralelo cuando hay
  curso seleccionado.

## Planilla de notas profesor

- `pages/Planilla.jsx`: pantalla de captura y gestion de notas del perfil
  profesor.
- `components/EncabezadoContextoCurso.jsx` reúne en una sola tarjeta la
  composición compacta del encabezado y el contexto de materia, salón, período
  y fecha. Planilla agrega allí mismo `Tipo de calificación`.
- Las acciones para agregar o eliminar tipos de evaluacion muestran spinner,
  bloquean temporalmente los controles y evitan envios duplicados mientras
  responde el backend. Cada boton aparece inmediatamente debajo de su campo
  correspondiente; usa fondo blanco, borde de color y ancho compacto en
  escritorio, alineado al lado izquierdo.
- Al completar `Agregar Tipo`, un modal breve confirma que el nuevo tipo de
  evaluacion fue guardado.
- En escritorio conserva la tabla tradicional con estudiantes en filas, tipos
  de evaluacion en columnas y promedio al final, con color verde desde `3.0` y
  rojo por debajo de `3.0`. Una columna compacta `N.º` numera los estudiantes
  segun su orden actual; permanece fija junto con `Estudiante` al desplazar la
  tabla horizontalmente. Toda la columna usa un fondo morado suave y plano, sin
  degradado. Su encabezado muestra un simbolo numeral vectorial de trazo grueso
  y extremos redondeados, sin capsula ni recuadro, y comparte el mismo fondo de
  las celdas numeradas. Una linea morada continua recorre el borde derecho de la
  columna hasta la ultima fila. La celda `Estudiante` permanece completamente
  blanca y sin degradado lateral.
- El encabezado de escritorio mantiene fondo blanco en `Estudiante`, tipos de
  evaluacion y `Promedio`. La diferenciacion usa texto, iconos lineales,
  contenedores de icono y una linea horizontal gris continua. Los separadores
  verticales de los tipos de nota usan una linea violeta visible al inicio de
  cada columna y un degradado que se desvanece solo hacia la derecha.
  `Estudiante` permanece blanco y sin degradado lateral. En `Promedio`, el
  separador cambia a verde esmeralda y continua por todas sus celdas hasta la
  ultima fila. El degradado verde se limita a la celda del encabezado
  `Promedio`; las celdas con valores mantienen fondo blanco. Lineas horizontales
  grises de alta transparencia separan cada fila de forma continua desde
  `Estudiante`, atraviesan las notas y llegan hasta `Promedio`. Los nombres
  conservan colores planos y `Estudiante` usa un morado mas visible, cercano al
  tono de su icono. Los tipos de nota centran verticalmente icono y nombre con
  la misma altura de `Promedio`. Las cabeceras permanecen visibles durante el
  desplazamiento.
- Lineas verticales de un pixel y alta transparencia separan `Estudiante`, cada
  columna de nota y `Promedio` sin generar bordes dominantes. La division de
  `Promedio` conserva verde esmeralda, pero con la misma intensidad tenue.
- La franja `Notas de Estudiantes` conserva fondo blanco; la tabla separa los
  bordes para renderizar las curvas de los extremos sin artefactos visuales.
- En movil usa tarjetas por estudiante para evitar que el nombre y las columnas
  queden comprimidos. Cada tarjeta muestra la numeracion en una insignia junto
  al nombre y lista los tipos de evaluacion de forma vertical.
- En calificacion numerica, la vista movil usa inputs de ancho completo con
  `inputMode="decimal"` para facilitar captura desde teclado movil.
- El promedio de cada tarjeta movil se pinta verde desde `3.0` y rojo por
  debajo de `3.0`.
- Al guardar una nota numerica, la tarjeta movil recalcula el promedio local
  mientras la planilla se sincroniza con el backend.
- La captura numerica normaliza coma decimal de teclado movil a punto para que
  el calculo local y el envio al backend usen el mismo valor.
- Si se escribe una nota fuera del rango de `1` a `5`, la celda restaura la
  ultima nota valida; si antes estaba vacia, vuelve a quedar vacia. El valor
  invalido no se envia al backend.
- En desarrollo infantil, reutiliza las opciones compartidas desde
  `constants/valoracionesDesarrollo.js` y muestra botones tactiles con
  etiqueta humana.
- La planilla marca nombres, etiquetas e inputs con `translate="no"` para
  reducir traducciones automaticas del navegador sobre textos guardados por el
  profesor.
- Oculta columnas internas como `mas_alto` para que no aparezcan como tipos de
  nota reales.

## Asistencia profesor

- `pages/Asistencia.jsx`: pantalla para registrar asistencia por fecha,
  asignacion y periodo.
- Reutiliza `components/EncabezadoContextoCurso.jsx` para mostrar en una sola
  tarjeta el encabezado y la información de materia, salón, período y fecha,
  sin alterar la marcación.
- Carga estudiantes desde `GET /planilla-excel/{asignacion_id}/{periodo}`.
- Carga historial desde `GET /asistencia/historial/{asignacion_id}/{periodo}`
  con estado visual de carga, reintento corto y mensaje de error con accion
  `Reintentar`.
- El historial se organiza en un mapa por estudiante para que el conteo de
  inasistencias no dependa de busquedas repetidas durante el render.
- Si existe registro para la fecha seleccionada, muestra aviso
  `Asistencia del día ya tomada`, precarga los botones presente/ausente y
  permite editarlo con estado visible de cambios pendientes.
- La fecha sigue dependiendo de la seleccion realizada en el dashboard; en
  Asistencia se muestra como dato de solo lectura.
- Incluye `Marcar todos presentes`, contadores de presentes/ausentes/pendientes,
  restauracion del estado guardado y confirmacion del resumen antes de guardar.
- La confirmacion de guardado usa un modal con resumen visual, bloqueo mientras
  responde el backend y resultado claro de exito o error.
- Los controles `Presente` y `Ausente` usan botones grandes con texto para
  facilitar la captura desde movil.
- Mientras el historial esta cargando, las filas muestran
  `Cargando historial...` en lugar de un contador provisional.

## Plan de clases profesor

- `pages/PlanDeClases.jsx`: pantalla de elaboracion diaria de planes de clase
  del perfil profesor.
- El encabezado utiliza una composición compacta: título y contexto a la
  izquierda, con el estado de guardado en una cápsula horizontal adaptable.
- Al guardar correctamente, la vista vuelve al encabezado y la cápsula
  `Guardado` se balancea una sola vez como confirmación no bloqueante. El
  movimiento se omite cuando el sistema solicita reducir animaciones.
- La acción final `Guardar plan` utiliza una tarjeta violeta destacada con
  icono, mensaje contextual y botón de alto contraste. El estado permanece
  únicamente en el encabezado principal para evitar duplicados.
- La configuración de la planeación distribuye clase, periodo y fecha en una
  barra `50 / 20 / 30`. Sus etiquetas reutilizan los iconos lineales y fondos
  suaves del dashboard del profesor.
- El cuadro `Guia didactica` presenta un spinner durante la carga inicial de
  clases y la consulta del plan de la fecha; los campos aparecen únicamente
  cuando los datos ya están listos para editar.
- Su encabezado muestra materia, curso y jornada en una cápsula verde
  adaptable; se oculta cuando todavía no se ha elegido una clase. Este resumen
  reemplaza la barra secundaria de clase seleccionada.
- El mismo encabezado ofrece `Presentación de clase`, una vista continua de
  lectura que utiliza el estado actual del formulario y conserva los cambios
  sin guardar al regresar. Organiza únicamente los bloques con contenido y
  muestra las dos evidencias actuales solo como imágenes, con apertura a tamaño
  completo; no incluye historial, guardado ni seguimiento administrativo. La
  vista se monta en una capa opaca independiente sobre toda la aplicación para
  ocultar correctamente el nav y bloquear la página de fondo.
- Toda la guía utiliza un fondo lavanda repetible con útiles escolares medianos
  en los bordes. Los bloques internos usan transparencias suaves para que la
  ilustración también se insinúe detrás de las superficies sin reducir la
  legibilidad.
- La guía inicia con un bloque de `Contexto pedagógico` que agrupa unidad, tema,
  logro y estándar sin volver obligatorios los campos ni limitar la longitud
  del contenido. Este bloque usa una superficie neutral sin fondo propio.
- `Clase` y `Actividad en clase` se presentan dentro de un bloque de
  `Desarrollo de la clase`, con seis líneas visibles y longitud de contenido
  indefinida.
- Desarrollo cognitivo y actividad en casa se agrupan en `Evidencias y
  continuidad`, con tarjetas morada y ámbar, descripciones amplias y selectores
  de archivo accesibles.
- Mantiene el guardado hacia `POST /plan-de-clases` con los campos y la
  evidencia visual opcional, y agrega `version_esperada` para impedir que una
  pestaña atrasada sobrescriba un guardado más reciente.
- Ante un conflicto `409`, ofrece cargar la versión actual del servidor o
  conservar temporalmente los cambios locales visibles para poder revisarlos
  antes de recargar.
- Si el guardado falla sin obtener una respuesta HTTP, distingue entre
  desconexión confirmada y servidor inaccesible. El modal permite reintentar o
  seguir editando sin limpiar textos ni imágenes.
- La interfaz se organiza como taller docente: contexto de clase, estado de
  guardado, guia didactica y evidencias.
- `Unidad` y `Tema` no aplican contador ni límite de caracteres en el frontend.
- `Unidad` y `Estándar` se recuerdan en `localStorage` por profesor y
  asignacion despues de un guardado correcto, y se precargan al crear otro plan
  nuevo para esa misma clase.
- El guardado permite campos academicos vacios; solo requiere clase/asignacion,
  periodo y fecha para ubicar el plan.
- Las evidencias visuales ya no se muestran en una seccion general: `imagen1`
  se presenta como evidencia de `Desarrollo cognitivo` e `imagen2` como
  evidencia de `Actividad en casa`, usando el contrato actual del backend.
- El historial permanece al final de la pantalla y muestra como máximo tres
  tarjetas por vista. Cada tarjeta presenta fecha, periodo, tema, unidad,
  estado de revisión y comentarios nuevos; su única acción es abrir la fecha
  seleccionada.
- La navegación consulta tres planes más recientes o más antiguos sin acumular
  tarjetas. Solicita un cuarto registro como indicador de continuación y no
  vuelve a cargar el historial cuando solo cambia la fecha abierta.
- Los apoyos laterales de plantillas rapidas e ideas para enriquecer fueron
  retirados temporalmente; el trabajo futuro es sugerir contenido desde la
  Malla Curricular de la asignacion y periodo.
- Un bloque independiente de `Seguimiento administrativo` aparece cuando la
  fecha seleccionada ya tiene un plan guardado. No reemplaza el indicador local
  de guardado del formulario. Se presenta como una barra compacta con estado,
  versión, fecha relevante y acceso desplegable a los comentarios; usa fondo
  lavanda, contorno violeta y un acento morado izquierdo para destacar su
  aparición sin aumentar el tamaño.
- El profesor distingue `Pendiente de revision`, `Revisado` y `Revisado con
  observacion`; esta ultima etiqueta se calcula por la existencia real de
  comentarios administrativos. Abrir el plan desde administracion no muestra
  un estado intermedio al profesor.
- Las observaciones permanecen cerradas hasta que el profesor pulsa `Ver`;
  solo entonces se consultan y se confirma su lectura en el backend.
- El historial conserva la version sobre la cual se escribio cada observacion.
  Una correccion solicitada aumenta la version sin volver a pendiente ni
  reenviarse a administracion.
- El plan correspondiente a la fecha activa se identifica en verde como
  `Plan en edición` y no permite volver a ejecutar la misma carga. Al elegir
  otra tarjeta, la vista sube para mostrar la clase seleccionada.
- Eliminar una evidencia recarga el plan y su historial porque esa accion crea
  una nueva version pendiente de revision.

## Malla Curricular profesor

- `pages/PlaneadorAnual.jsx`: organiza hasta ocho filas curriculares por
  asignacion y periodo.
- Cada fila admite uno o varios campos academicos, pero requiere una fecha
  limite cuando contiene informacion.
- Rechaza en la interfaz tanto contenido sin fecha como fecha sin contenido y
  explica la fila que debe corregirse.
- Las filas completamente vacias son validas y no crean registros; si una fila
  guardada se vacia, el backend elimina ese `slot` al actualizar.
- La carga respeta el `slot` retornado por el backend, evitando mover contenido
  cuando hay filas vacias entre registros.
- El boton muestra spinner durante el guardado y SweetAlert2 confirma el
  resultado.

## Planeadores admin

- `pages/PlaneadoresClasesAdmin.jsx`: bandeja administrativa a ancho completo
  de planes enviados por profesores.
- La columna lateral `Envios recibidos` y su scroll vertical interno fueron
  retirados. La lista usa todo el ancho disponible y el desplazamiento normal
  de la pagina.
- Al entrar, `Hoy y próximas` queda seleccionado por defecto. El administrador
  puede cambiar a `Anteriores` o `Todas`; `Anteriores` usa fechas previas al
  dia actual y la fecha de hoy pertenece a `Hoy y próximas`.
- El selector `Vista por fecha` se diferencia del resto de la cabecera con una
  paleta esmeralda y turquesa; la opción activa usa fondo esmeralda sólido y
  contraste blanco.
- El selector explica el alcance temporal elegido y reemplaza los antiguos
  contadores de resultados, elementos por pagina y evidencias.
- El filtro visible ofrece solamente `Pendiente` y `Revisado` y permite
  desactivar la selección al pulsarla otra vez. Para conservar compatibilidad,
  `Pendiente` agrupa el estado interno `visto` y `Revisado` agrupa
  `con_observaciones`.
- La bandeja no consulta ni muestra filas hasta que el administrador tiene una
  vista por fecha y un estado de revisión. `Hoy y próximas` completa la vista
  inicial; el estado guiado solicita elegir el estado pendiente. Al regresar de
  un detalle ambos valores se recuperan desde la URL.
- Al volver del detalle o actualizar los filtros, el área de resultados muestra
  un spinner centrado y un mensaje acorde con el estado seleccionado; la
  cabecera, el profesor, los estados y la búsqueda permanecen visibles.
- La tarjeta de filtros alinea en una misma fila de escritorio el selector de
  profesor y las cápsulas compactas de estado, sin numeración. Las cápsulas
  conservan su tamaño original, flotan con separación uniforme y pueden
  reorganizarse debajo del profesor en móvil. Las burbujas de conteo mantienen
  sin cambios su apariencia flotante. El profesor se aplica inmediatamente.
  La búsqueda por materia o clase vive dentro de la tarjeta del historial y se
  aplica automáticamente tras 120 milisegundos desde dos caracteres; al
  vaciarla se restauran inmediatamente los resultados sin modificar los demás
  filtros.
- Solo `Pendiente` muestra un contador tipo notificación, calculado según la
  vista temporal, el profesor y la búsqueda aplicados. `Revisado` permanece sin
  contador para reducir ruido visual.
- Cada fila presenta el tema con un peso visual moderado, diferencia la materia
  del curso para facilitar la lectura y muestra `Revisión N` en lugar de la
  etiqueta técnica `Versión N`. La misma jerarquía se conserva en móvil.
- Consume `GET /admin/plan-de-clases` con profesor, búsqueda por materia o
  tema, estado, `limit` y `offset`. Los límites de fecha se generan desde la
  vista temporal superior; no existen campos manuales `Desde` y `Hasta`.
- Usa paginas de 12 registros con controles `Anterior` y `Siguiente`; ya no
  acumula resultados mediante `Cargar mas`.
- Cada planeacion abre una vista independiente en
  `/admin/planeadores-clases/:planId`. Los filtros y la pagina se conservan en
  la URL para regresar al mismo punto de la bandeja.
- El detalle consume `GET /admin/plan-de-clases/{plan_id}` sin cambiar el
  estado por la simple apertura y presenta una sola caja de comentario con dos
  decisiones: solicitar un ajuste obligatorio o aprobar con reconocimiento
  opcional, hasta 3000 caracteres.
- La aprobación con comentario agrega el mensaje al historial y conserva el
  estado `revisado`; la solicitud de ajuste usa internamente
  `con_observaciones`, pero se presenta dentro de `Revisado`.
- Después de aprobar o solicitar un ajuste con éxito, la vista vuelve
  automáticamente al inicio del detalle para mostrar el estado y la
  confirmación.
- La confirmación exitosa entra con una animación breve y muestra
  `Actualización nueva`; el movimiento ocurre una sola vez y respeta la
  preferencia de reducción de movimiento del dispositivo.
- Si el profesor guarda otra version mientras el admin revisa, el conflicto
  `409` recarga el contenido reciente y evita aprobar u observar datos viejos.
- El historial identifica la version observada y si el profesor ya confirmo
  su lectura.
- El detalle conserva la gestion de imagenes adjuntas.
- Las evidencias del plan se etiquetan por campo: desarrollo cognitivo y
  actividad en casa.
- El cuerpo del plan seleccionado se presenta como reporte visual: encabezado
  compacto con estado y revisión debajo del tema y el docente destacado a la
  derecha con separación adicional del borde, cuadrícula de materia, curso,
  periodo, fecha, evidencias y `Comentarios de admin`, fundamentos pedagogicos
  en bloques, ruta de clase destacada, actividades separadas y evidencias al
  final. Si falta el tema, usa materia y curso como título y muestra un aviso
  secundario.
- Dentro de los bloques del detalle solo aparece el nombre real del campo en
  violeta; se omiten etiquetas auxiliares como `Eje de trabajo`, `Proceso`,
  `Durante la jornada` o `Continuidad`. Los campos pedagógicos comienzan
  directamente, sin los encabezados `Fundamentos` y `Base pedagógica del plan`.

## Comportamiento UX movil documentado

- `NavAdmin.jsx`: en movil muestra enlaces principales y grupos colapsables.
  Las subpestanas de admin se abren solo al seleccionar su grupo, para evitar
  que el menu despliegue todas las opciones al abrirse.
- `DocumentoImprimible.jsx`: recibe `className` para marcar documentos que
  necesitan comportamiento especial de pantalla. Los documentos marcados como
  boletin, certificado o cartera usan root con scroll lateral en movil.
- `Boletin.jsx`: el impreso final conserva ancho A4 en movil y se desplaza a
  los lados. El boton `Atras` queda arriba a la izquierda.
- `CertificadosAdmin.jsx`: certificado de notas, certificado de matricula y
  reporte academico parcial conservan ancho A4 en movil, tienen scroll lateral
  y boton `Atras` arriba. El reporte parcial permite imprimir curso completo o
  estudiante individual por periodo y materia, incluyendo inasistencias del
  periodo.
- `CarteraVencidaAdmin.jsx`: los estados de cuenta por estudiante y por curso
  conservan ancho A4 en movil y usan scroll lateral.
- `EstudiantesAdmin.jsx`: el modal de detalle del estudiante organiza el
  observador en tarjetas con chips de periodo, materia, profesor y fecha. En
  movil las secciones se apilan; en escritorio se muestran como columnas.

## Componentes por modulo

### Admin

- `components/admin/IdentidadInstitucional.jsx`
- `components/admin/PlantillasAdmin.jsx`
- `components/OrdenBoletin.jsx`: pestaña de Administracion para definir el
  orden de materias por curso en boletines, con flechas, posicion numerica y
  guardado por curso.

### Boletin

- `components/boletin/Boletin.jsx`
- `components/boletin/Header.jsx`
- `components/boletin/IngresoBoletinProfesor.jsx`: ingreso de observaciones de
  boletin final; oculta notas tecnicas como `mas_alto` y muestra los tipos de
  nota con etiquetas humanas marcadas con `translate="no"`.
- `components/boletin/Materia.jsx`
- `components/boletin/TablaNotas.jsx`

### Constantes

- `constants/valoracionesDesarrollo.js`: opciones compartidas de desarrollo
  infantil (`Destacado`, `Logrado`, `En proceso`, `Requiere apoyo`) usadas por
  planilla y vistas relacionadas.

### Cartera

- `components/cartera/AdministrarTiposPago.jsx`

### Pagos administrativos

- `pages/PagosAdmin.jsx` conserva el registro normal de deudas y cargos de
  inventario mediante `POST /pagos`.
- En conceptos mensuales, `Pago pendiente` muestra tarjetas seleccionables por
  mes, saldo y estado vencido/parcial; el mes mas antiguo inicia seleccionado.
- Se puede elegir todos los meses, volver al mas antiguo o usar `Abono libre`
  para mantener el registro anterior sin periodo.
- El total y el primer metodo se sincronizan con los meses seleccionados y una
  confirmacion resume periodos y valor antes de guardar.
- El formulario ofrece de forma separada `Meses adelantados`, disponible solo
  para conceptos mensuales asignados al estudiante.
- El modo adelantado muestra los meses futuros libres, cantidad, valor por
  cuota y total antes de registrar; no permite editar manualmente ese total.
- Dentro de adelantos se puede alternar entre `Meses completos` y `Distribuir
  un monto`; la segunda opcion esta pensada para subsidios y remanentes.
- La vista previa detalla monto aplicado y saldo restante por mes, advierte si
  existe deuda vencida y bloquea valores que no caben antes de diciembre.
- `Subsidio` se ofrece como metodo identificable y deja la referencia como
  texto libre escrito por el usuario, sin entidades predefinidas.
- Los metodos de pago deben sumar el total calculado y el backend vuelve a
  validar meses, asignacion y valor vigente.
- Un error al consultar adelantos no impide usar el pago normal.
- `pages/ReportesAdmin.jsx` permite filtrar el detalle de ingresos por
  `Subsidio` y muestra su referencia, incluso dentro de pagos mixtos.

### Impresion

- `components/impresion/DocumentoImprimible.jsx`

Notas:

- El toolbar de documentos imprimibles muestra `Descargar PDF` e `Imprimir`.
  Ambos botones usan el dialogo nativo del navegador mediante `window.print()`.
- En celular, el resultado de descarga depende del navegador. Android/Chrome
  suele mostrar `Guardar como PDF`; iOS/Safari puede mostrar opciones de
  compartir o imprimir.

## Paginas existentes

- `Admin.jsx`
- `AdminDashboard.jsx`
- `Asistencia.jsx`
- `BrandingAdmin.jsx`
- `CarteraVencidaAdmin.jsx`
- `CertificadosAdmin.jsx`
- `DashboardAdmin.jsx`
- `DashboardProfesor.jsx`
- `EgresosAdmin.jsx`
- `EstudiantesAdmin.jsx`
- `Formulario.jsx`
- `GestionAcademica.jsx`
- `HorariosAdmin.jsx`
- `InventarioAdmin.jsx`
- `Login.jsx`
- `NominaAdmin.jsx`
- `PagosAdmin.jsx`
- `PlanDeClases.jsx`
- `PlaneadorAnual.jsx`
- `PlaneadoresClasesAdmin.jsx`
- `Planilla.jsx`
- `PrestamosAdmin.jsx`
- `RankingMejorRendimiento.jsx`
- `RankingRendimiento.jsx`
- `ReportesAdmin.jsx`
- `SuperAdminDashboard.jsx`
- `TiposPagosAdmin.jsx`
- `VentasAdmin.jsx`

## Hooks y servicios

- `hooks/usePrintConfig.js`: hook relacionado con configuracion de impresion.
- `services/printingService.js`: servicio para branding, plantillas e impresion.
- `utils/api.js`: cliente Axios compartido.

## Estilos

- `src/index.css`: estilos globales cargados desde `main.jsx`.
- `styles/print.css`: estilos para impresion.

`styles/print.css` contiene las reglas moviles de documentos imprimibles:

- documentos comunes: se adaptan al ancho disponible;
- boletin/certificados/cartera: mantienen `210mm` de ancho y se desplazan
  horizontalmente en pantallas pequenas.
