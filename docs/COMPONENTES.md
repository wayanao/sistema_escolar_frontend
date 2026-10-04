# Componentes

Estado actual de componentes y paginas del frontend.

## Componentes principales

- `Login.jsx`: acceso inmersivo y responsive de Auligo. Usa la fotografia
  institucional original como fondo y mejora su integracion mediante filtros y
  capas CSS, sin alterar las personas de la imagen. Presenta el eslogan oficial
  `Tu aula, tu camino, tu futuro.` y concentra el formulario en una tarjeta de
  cristal translucido con desenfoque y contraste de lectura. Conecta
  `useComandoLogin` con `LoginFormView` como raíz de composición.
- `components/autenticacion/LoginFormView.jsx`: formulario presentacional de
  acceso con identidad visual de Auligo. Recibe campos, estados y acciones desde
  `pages/Login.jsx`; permite mostrar u ocultar la contraseña, muestra respuesta
  inmediata al enviar y avisa cuando la conexión tarda más de lo esperado.
- `components/autenticacion/CambiarPasswordView.jsx`: formulario
  presentacional del cambio obligatorio; recibe valores, cambios, submit y
  estado de guardado desde `pages/CambiarPassword.jsx`.
- `components/autenticacion/NavAdminView.jsx`: menu principal para usuario
  admin; en movil agrupa secciones, usa etiquetas principales mas legibles,
  muestra solo la marca mas visible en un encabezado compacto, protege etiquetas
  como `Nómina` con `translate="no"` y mantiene visible la campana de planeaciones.
- `components/autenticacion/NavProfesorView.jsx`: menu principal para profesor;
  en movil separa control academico y planeacion, con etiquetas principales mas
  legibles, encabezado compacto con solo la marca visible y campana para
  observaciones nuevas.
- `components/planeaciones/TextoConEnlaces.jsx`: pinta el texto libre de una
  planeación reconociendo los enlaces `http`/`https`. Parte el texto con
  `utils/planeaciones/enlaces.js` y deja que React escape cada tramo; no inyecta
  HTML. Un video de YouTube se vuelve un botón `Reproducir video`; cualquier otro
  enlace muestra la URL completa como etiqueta y abre con `target="_blank"` y
  `rel="noopener noreferrer"`. Lo usan la presentación del profesor y el detalle
  del admin.
- `components/planeaciones/CapaVisorPlaneacion.jsx`: base compartida de las capas
  que muestran una evidencia sola sobre la pantalla actual. Aporta el fondo, el
  botón de cerrar, el enlace externo opcional y el cierre tocando fuera. Escucha
  Escape en **fase de captura** y detiene su propagación, para que cerrar la capa
  no cierre también la presentación de clase que hay debajo.
- `components/planeaciones/ReproductorVideoPlaneacion.jsx`: la capa con el video
  solo, servido desde `youtube-nocookie.com`. Conserva un enlace
  `Abrir en YouTube` por si el video no permite incrustarse.
- `components/planeaciones/VisorPdfPlaneacion.jsx`: la capa con el PDF solo.
  Recibe una URL `blob:` ya descargada con la sesión del usuario, nunca una ruta
  del servidor, y ofrece `Abrir en otra pestaña` como salida para los navegadores
  que no incrustan PDF.
- `components/planeaciones/ContenidoEvidencia.jsx`: pinta el interior de una
  evidencia. Una imagen se muestra tal cual; un PDF no se puede previsualizar sin
  descargarlo entero, así que se anuncia con una portada y su nombre en vez de
  dejar un recuadro roto. También resuelve los estados de carga y error.
- `components/planeaciones/NotificacionesPlaneadores.jsx`: campana compartida
  por admin y profesor. Es un conector mínimo entre el hook de consulta, el
  router, el estado local del panel y `NotificacionesPlaneadoresVista.jsx`.
  Mediante el servicio consulta `GET /notificaciones/planeadores`, muestra
  contador y hasta ocho
  pendientes para profesor; en admin consulta hasta veinte envíos recientes y
  recibe un resumen por docente. Cada tarjeta muestra la cantidad total y abre
  directamente la bandeja `Todas + Pendiente`, filtrada con el identificador
  exacto del profesor; ya no despliega las clases dentro de la campana. Se
  refresca cada 60 segundos/foco/evento local. La notificacion administrativa
  permanece hasta aprobar o solicitar un ajuste; una observacion del profesor
  no se marca como leida hasta abrir su historial. En móvil y tablet, la
  ventana se posiciona dentro del encabezado con márgenes laterales seguros y
  una altura máxima dinámica, por lo que acompaña al navbar y sale del viewport
  al desplazar la página; encabezado y acción inferior permanecen visibles
  mientras la lista central hace scroll. En escritorio continúa anclada
  directamente a la campana.
- `components/autenticacion/DesktopAnimatedNav.jsx`: nav compartido de
  escritorio para admin/profesor;
  usa indicador animado medido por elemento activo/hover, sin depender de
  `nth-child` ni de una cantidad fija de pestañas. Las pestañas principales de
  escritorio usan `15px` para mejorar lectura.
- `components/autenticacion/NavSuperAdminView.jsx`: menu principal para super
  admin de plataforma.
- Las tres vistas de navegación muestran el logotipo
  transparente de `Auligo` en lugar del texto `Scholarix`; la marca conserva su
  enlace al inicio correspondiente de cada perfil. Sus elementos verdes usan
  mayor brillo y saturacion para conservar contraste sobre el navbar. Una
  sombra visible aplicada al contorno y un brillo discreto le dan profundidad
  aun sin interaccion, sin agregar una tarjeta o fondo.
- `index.html` declara el favicon de Auligo en formatos ICO, PNG de `16x16` y
  `32x32`, ademas del icono Apple de `180x180`. Usa una `A` morada minimalista
  sobre tarjeta blanca redondeada, sin elementos adicionales ni contorno de
  color, y con exterior transparente.
- `components/autenticacion/TenantStatusBannerView.jsx`: aviso global
  presentacional cuando el hook entrega un tenant en mora.
- `hooks/planeaciones/useAperturaEvidencia.js`: decide cómo se abre una evidencia
  ya descargada. Un PDF se muestra en una capa sobre la pantalla, para no sacar al
  profesor de la clase; una imagen sigue abriéndose en otra pestaña, como siempre.
  Lo usan los cuatro lugares que muestran evidencias.
- `hooks/planeaciones/useImagenProtegida.js`: administra la carga, error y ciclo
  de vida de imágenes autenticadas para presentación, evidencias del profesor y
  detalle admin; el transporte blob permanece en `planeacionesApi.js`.
- `components/administracionAcademica/asignaciones/AsignarClase.jsx`:
  contenedor de asignaciones; conecta consultas, disponibilidad y comandos con
  selector, formulario y calendarios presentacionales. No selecciona un curso
  por defecto al cargar.
- `components/administracionAcademica/cursos/CrearCurso.jsx`: contenedor de
  creación, edición, estado y listado de cursos.
- `components/administracionAcademica/materias/CrearMateria.jsx`: contenedor de
  creación, edición, estado y listado de materias.
- `components/administracionAcademica/profesores/CrearProfesor.jsx`: contenedor
  de creación, edición, búsqueda, estado y listado de profesores.
- `pages/OrdenBoletin.jsx`: raíz de composición del orden responsive de
  materias por curso para impresión de boletines.
- `components/administracionAcademica/horarios/HorariosProfesores.jsx` y
  `HorariosPorCurso.jsx`: contenedores de consulta para calendarios por profesor
  y curso; delegan toda la presentación a componentes del mismo dominio.
- `components/pagos/FacturaModerna.jsx`: cuerpo del comprobante de pago,
  compuesto dentro de `DocumentoImprimible` por `ComprobantePago.jsx`.
- `components/planilla/PlanillaRow.jsx`: fila de planilla; muestra las notas
  por columna y el promedio del estudiante.
- `components/asistencia/AsistenciaRow.jsx`: fila de asistencia; muestra botones
  presente/ausente y contador de inasistencias cuando el historial ya cargó.
- `components/estudiantesObservador/Observaciones.jsx`: contenedor del
  observador por estudiante; conecta el hook editable con SweetAlert2 y
  `DocumentoImprimible`. Activa la consulta al acercarse al viewport, usa
  cancelación con tiempo límite, distingue errores de registros pendientes,
  permite reintentar y conserva el guardado parcial.
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

- `pages/Planilla.jsx`: raíz de composición para la captura y gestión de
  notas del perfil profesor. Lee el contexto superior, conserva navegación y
  conecta hooks con componentes; no conoce rutas HTTP ni contiene comandos o
  bloques visuales extensos.
- `services/planillaApi.js` encapsula clases, planilla, guardado de nota y
  eliminación de tipo de evaluación; acepta señales de cancelación y propaga
  errores sin decidir interfaz.
- `utils/planilla/notas.js` contiene la columna interna reservada, el
  formateo de etiquetas, las notas visibles, el cálculo de promedio, la
  normalización de coma decimal, la construcción del payload de nota y la
  comparación `hayCambioDeNota`, que decide si una celda merece una petición.
- `hooks/planilla/useConsultasPlanillaProfesor.js` carga clases y planilla
  (estudiantes y columnas visibles) y descarta respuestas obsoletas.
- `hooks/planilla/useComandosPlanillaProfesor.js` administra el guardado y
  limpieza de notas, las valoraciones de desarrollo y el alta/baja de tipos
  de evaluación con su progreso. Guardar una nota cuesta **una sola
  escritura**: no recarga la planilla, no guarda si el valor no cambió y
  encola los guardados de una misma celda. Expone `notasSinGuardar`, las
  celdas cuyo guardado falló.
- `components/planilla/PlanillaMobileCard.jsx` y
  `components/planilla/PlanillaRow.jsx` presentan la tarjeta móvil y la fila
  de escritorio de cada estudiante. Una celda cuyo guardado falló se marca en
  rojo con el título "Sin guardar" y conserva el valor escrito; volver a salir
  de ella reintenta.
- `components/planilla/SelectorTipoEvaluacion.jsx` presenta el control
  `Tipo de calificación`; `components/planilla/GestionTiposEvaluacion.jsx`
  presenta el alta y baja de tipos; `components/planilla/TablaNotasPlanilla.jsx`
  compone el título, la lista móvil y la tabla de escritorio.
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

- `pages/Asistencia.jsx`: raíz de composición para registrar asistencia por
  fecha, asignación y período. Lee el contexto superior, conserva navegación y
  conecta hooks con componentes; no conoce rutas HTTP ni contiene comandos o
  bloques visuales extensos.
- Reutiliza `components/EncabezadoContextoCurso.jsx` para mostrar en una sola
  tarjeta el encabezado y la información de materia, salón, período y fecha,
  sin alterar la marcación.
- `services/asistenciaApi.js` encapsula planilla, clases, historial y guardado;
  acepta señales de cancelación y propaga errores sin decidir interfaz.
- `utils/asistencia/profesor.js` contiene normalización de fechas, índice del
  historial, resumen, detección de cambios, marcación masiva y payload.
- `hooks/asistencia/useConsultasAsistenciaProfesor.js` carga estudiantes,
  clases e historial, conserva el reintento corto y descarta respuestas
  obsoletas.
- `hooks/asistencia/useComandosAsistenciaProfesor.js` administra hidratación,
  edición, validaciones, confirmaciones, guardado y recarga posterior.
- `components/asistencia/AvisoRegistroAsistencia.jsx` muestra registro guardado
  o edición pendiente.
- `components/asistencia/PanelAsistenciaProfesor.jsx` presenta carga/error,
  reintento, marcación rápida, resumen, filas y estado vacío.
- `components/asistencia/BarraGuardadoAsistencia.jsx` presenta el resumen
  inferior y delega el comando de guardado.
- `components/asistencia/AsistenciaRow.jsx` conserva los controles accesibles y
  el contador histórico por estudiante.
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
- La primera capa de modularización delega estados iniciales, estados visuales,
  claves recordadas y formateo de fechas en
  `utils/planeaciones/profesor.js`. En esa etapa el componente mantuvo intactos
  el estado, los efectos, las llamadas API y la presentación.
- La segunda capa consume `services/planeacionesApi.js` y deja de conocer rutas
  HTTP o configuraciones de Axios. Conserva el armado de `FormData`, las
  decisiones ante conflictos, el estado de React y la presentación.
- La tercera capa delega paginación, carga y actualización del historial en
  `hooks/planeaciones/useHistorialPlaneacionesProfesor.js`, y la apertura,
  lectura y errores de comentarios en
  `hooks/planeaciones/useObservacionesPlaneacionProfesor.js`.
- En la tercera capa, el formulario, la carga del plan diario, el guardado, las
  imágenes y la presentación permanecieron coordinados por la página.
- La cuarta capa delega campos, periodo, fecha, imágenes, valores recordados y
  estado local de guardado en
  `hooks/planeaciones/useFormularioPlaneacionProfesor.js`.
- `hooks/planeaciones/useCargaPlanDiarioProfesor.js` administra la consulta y
  recarga del plan activo, descartando respuestas de una selección anterior.
- En la cuarta capa, la página conservó el envío remoto, la resolución de
  conflictos, los reintentos y las decisiones asociadas al guardado.
- La quinta capa delega esas responsabilidades en
  `hooks/planeaciones/useGuardadoPlaneacionProfesor.js`, incluyendo el multipart
  y la recuperación ante conflicto o conexión interrumpida.
- La página recibe el resultado para actualizar el identificador, el mensaje y
  la confirmación visual, sin conocer SweetAlert2 ni ejecutar el `POST`.
- La sexta capa incorpora
  `components/planeaciones/profesor/SeguimientoPlanProfesor.jsx` para estado y
  comentarios administrativos.
- `components/planeaciones/profesor/HistorialPlanesProfesor.jsx` presenta los
  planes guardados, su paginación y la selección activa.
- `components/planeaciones/profesor/EstadoRevisionBadge.jsx` es la insignia
  compartida por seguimiento e historial. Los tres componentes son
  presentacionales y reciben datos y callbacks mediante props.
- La séptima capa traslada toda la guía editable a
  `components/planeaciones/profesor/GuiaDidacticaProfesor.jsx`.
- `components/planeaciones/profesor/CampoTextareaPlanProfesor.jsx` unifica los
  campos con contador y límite de caracteres.
- `components/planeaciones/profesor/EvidenciasPlanProfesor.jsx` presenta la
  carga, previsualización y eliminación de evidencias nuevas o guardadas: una
  imagen de hasta 5MB o un PDF de hasta 15MB por espacio.
- Estos componentes no administran el formulario ni consultan la API:
  `PlanDeClases.jsx` continúa coordinando los hooks y entrega valores y
  callbacks mediante props.
- La octava capa extrae la ventana completa a
  `components/planeaciones/profesor/PresentacionClaseProfesor.jsx`.
- La presentación administra únicamente efectos de interfaz propios del modal:
  portal al `body`, bloqueo y restauración del scroll, cierre con Escape y
  apertura segura de evidencias.
- Su contenido se deriva de props, delega la resolución protegida de imágenes
  al hook compartido y no modifica el formulario. La página mantiene solo el
  estado de apertura y cierre.
- Cada campo se pinta con `TextoConEnlaces`, de modo que un link de YouTube
  escrito dentro del texto se reproduce con un clic sobre la misma presentación,
  sin cambiar de pestaña ni salir de la clase.
- La novena capa incorpora
  `components/planeaciones/profesor/EncabezadoPlanProfesor.jsx` para el título,
  la identificación del plan y el estado visual del guardado.
- `components/planeaciones/profesor/ConfiguracionPlanProfesor.jsx` presenta los
  selectores de clase y periodo junto con la fecha activa.
- La página conserva los estados seleccionados y entrega callbacks a la
  configuración. La traducción del estado de guardado a textos y estilos se
  resuelve en `utils/planeaciones/profesor.js`.
- La décima capa traslada la confirmación visual a
  `components/planeaciones/profesor/GuardadoPlanProfesor.jsx`.
- El panel recibe progreso, texto, mensaje y acción mediante props. No construye
  el multipart, no muestra alertas de conflicto y no ejecuta directamente el
  servicio de planeaciones.
- El hook `useGuardadoPlaneacionProfesor` continúa siendo el único responsable
  del comando remoto y sus recuperaciones.
- La undécima capa completa la consolidación del profesor con
  `useClasesPlaneacionProfesor`, `useSeguimientoPlaneacionProfesor` y
  `useEliminacionImagenPlanProfesor`.
- Estos hooks aíslan respectivamente el contexto de clases, la coordinación de
  revisión/comentarios y el comando de eliminación de evidencias.
- `pages/PlanDeClases.jsx` queda como raíz de composición: conecta hooks con
  componentes y no importa el servicio HTTP de planeaciones.
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

- `pages/PlaneadorAnual.jsx`: raíz de composición de la ruta
  `/planeador-anual`; conecta hooks, contexto e impresión sin conocer endpoints,
  payloads ni bloques visuales extensos.
- `services/mallaCurricularApi.js`: frontera HTTP única para asignaciones,
  consulta por período y guardado posicional.
- `utils/mallaCurricular/planeadorAnual.js`: contrato puro de ocho filas,
  mapeo por `slot`, normalización, validaciones y payload.
- `hooks/mallaCurricular/useConsultasMallaCurricular.js`: administra período,
  persistencia, asignación, carga, recarga y descarte de respuestas antiguas.
- `hooks/mallaCurricular/useComandosMallaCurricular.js`: administra filas
  editables, validaciones, progreso, guardado, confirmaciones y errores.
- `components/mallaCurricular/EncabezadoMallaCurricular.jsx`: título, contexto,
  estado y selector controlado de período.
- `components/mallaCurricular/EditorMallaCurricular.jsx`: ocho tarjetas móviles
  y tabla de escritorio, campos obligatorios y autoajuste de textareas.
- `components/mallaCurricular/AccionesMallaCurricular.jsx`: progreso y acciones
  controladas de guardar e imprimir.
- `components/mallaCurricular/EstadosMallaCurricular.jsx` y
  `VistaImprimibleMallaCurricular.jsx`: carga, ausencia de asignación e impreso
  contextual con regreso al editor.
- `components/mallaCurricular/estadoVisualMallaCurricular.js`: representación
  única de “Verificando”, “Cambios sin guardar”, “Guardado” y “Pendiente”.
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
- Los componentes reciben valores y callbacks mediante props y no conocen el
  transporte ni el almacenamiento del dominio.

## Planeadores admin

- `pages/PlaneadoresClasesAdmin.jsx`: bandeja administrativa a ancho completo
  de planes enviados por profesores.
- La primera capa de modularización delega constantes de filtros, fechas,
  normalización de respuestas, parámetros de consulta y mensajes de error en
  `utils/planeaciones/admin.js`. En esa etapa el componente mantuvo intactos el
  estado, los efectos, las llamadas API y la presentación.
- La segunda capa consume `services/planeacionesApi.js` para bandeja, conteos,
  profesores, detalle, revisión, comentarios e imágenes. La pantalla mantiene
  la coordinación de esas operaciones y sus estados visuales.
- La tercera capa administrativa traslada filtros, búsqueda, profesores,
  consultas, contador pendiente, URL y paginación a
  `hooks/planeaciones/useListadoPlaneacionesAdmin.js`.
- La bandeja recibe del hook datos y acciones preparados, conserva el render y
  navega al detalle sin importar los servicios de listado.
- Las utilidades del profesor y administrador viven bajo
  `utils/planeaciones/`, organizadas por dominio en lugar de acumular archivos
  en la raíz de `utils`.
- La cuarta capa administrativa traslada carga del detalle, revisión,
  comentarios y conflictos a
  `hooks/planeaciones/useDetallePlaneacionAdmin.js`.
- `hooks/planeaciones/useEliminacionImagenPlaneacionAdmin.js` encapsula la
  confirmación y el comando de borrado de evidencias.
- La página recibe estados y acciones de ambos hooks y deja de importar
  directamente cualquier operación del servicio de planeaciones.
- La quinta capa administrativa traslada el encabezado y selector temporal a
  `components/planeaciones/admin/EncabezadoPlaneacionesAdmin.jsx`, y los
  filtros de profesor y revisión a
  `components/planeaciones/admin/FiltrosPlaneacionesAdmin.jsx`.
- `components/planeaciones/admin/ElementosPlaneacionAdmin.jsx` concentra
  badges, mensajes accesibles, spinner y la clase visual compartida de campos.
- Los componentes administrativos reciben valores y callbacks mediante props.
  La página conserva la composición, navegación y conexión con los hooks, sin
  duplicar esos bloques presentacionales.
- La sexta capa administrativa traslada búsqueda, cabecera de resultados,
  tabla, tarjetas móviles, estados y paginación a
  `components/planeaciones/admin/ResultadosPlaneacionesAdmin.jsx`.
- El componente de resultados recibe planes, filtros visibles, estado de carga
  y callbacks. La página conserva el hook de listado y la navegación al
  detalle, incluyendo los parámetros actuales de la URL.
- La séptima capa administrativa traslada carga, error, reporte del plan,
  revisión, historial y evidencias a
  `components/planeaciones/admin/DetallePlaneacionAdmin.jsx`.
- El detalle recibe estado y acciones desde el hook de la página, y reutiliza
  `useImagenProtegida` para mostrar adjuntos autenticados sin conocer los
  servicios de planeaciones.
- Los bloques de texto del plan también se pintan con `TextoConEnlaces`, para que
  administración pueda abrir el material enlazado al revisar.
- `pages/PlaneadoresClasesAdmin.jsx` queda como raíz de composición de la
  bandeja y el detalle, responsable únicamente de hooks, rutas y navegación.
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

- `components/autenticacion/NavAdminView.jsx`: en movil muestra enlaces
  principales y grupos colapsables.
  Las subpestanas de admin se abren solo al seleccionar su grupo, para evitar
  que el menu despliegue todas las opciones al abrirse.
- `DocumentoImprimible.jsx`: recibe `className` para marcar documentos que
  necesitan comportamiento especial de pantalla. Los documentos marcados como
  boletin, certificado o cartera usan root con scroll lateral en movil.
- `components/boletin/BoletinImprimible.jsx`: el impreso final conserva ancho
  A4 en movil y se desplaza a los lados. El boton `Atras` queda arriba a la
  izquierda.
- Las vistas imprimibles de `components/certificadosImpresion/` conservan ancho
  A4 en movil, scroll lateral y boton `Atras` arriba. El reporte parcial permite
  imprimir curso completo o estudiante individual por periodo y materia,
  incluyendo inasistencias del periodo.
- `CarteraVencidaAdmin.jsx`: los estados de cuenta por estudiante y por curso
  conservan ancho A4 en movil y usan scroll lateral.
- `EstudiantesAdmin.jsx`: el modal de detalle del estudiante organiza el
  observador en tarjetas con chips de periodo, materia, profesor y fecha. En
  movil las secciones se apilan; en escritorio se muestran como columnas.

## Componentes por modulo

### Autenticación y navegación

- `components/autenticacion/`: seis vistas presentacionales para acceso,
  cambio obligatorio de password, tenant y navegación por rol.
- `pages/Login.jsx` y `pages/CambiarPassword.jsx`: raíces de composición de los
  dos formularios.
- `App.jsx`: raíz de rutas, guards, layouts, navegación y aviso tenant. En
  el layout del admin conecta también el año lectivo: `AnioLectivoProvider`,
  el selector (que `NavAdminView` dibuja con `renderSelectorAnio`, como las
  notificaciones) y el aviso, y reinicia la página al cambiar de año
  (`RutasDelAnio`).
- `components/anioLectivo/SelectorAnioLectivoView.jsx`: la cajita para elegir
  el año en la barra del admin. Solo aparece con más de un año y en las
  pantallas que siguen el año.
- `components/anioLectivo/AvisoAnioLectivoView.jsx`: el aviso debajo de la
  navegación ("Estás viendo el año 2026 (cerrado). Solo consulta.", "Estás
  preparando el año 2027.") con el botón para volver al año activo. Mismo
  lugar y forma que el aviso del tenant, en azul.
- `components/autenticacion/DesktopAnimatedNav.jsx`: presentación compartida
  de escritorio para admin y profesor.
- `components/planeaciones/NotificacionesPlaneadores.jsx`: componente
  compartido del dominio de planeaciones integrado mediante rol y callback de
  navegación; consume `useNotificacionesPlaneadores` y delega el marcado en
  `NotificacionesPlaneadoresVista.jsx`. El contrato puro del evento está en
  `utils/planeaciones/notificacionesContratos.js` y su sincronización en hooks.
  El hook admite **una sola consulta en vuelo** (volver a la pestaña dispara
  `focus` y `visibilitychange` a la vez) y salta el sondeo de 60 s mientras la
  pestaña está oculta.

### Asistencia

- `components/asistencia/AvisoRegistroAsistencia.jsx`
- `components/asistencia/BarraGuardadoAsistencia.jsx`
- `components/asistencia/PanelAsistenciaProfesor.jsx`
- `components/asistencia/AsistenciaRow.jsx`

### Planilla

- `components/planilla/PlanillaMobileCard.jsx`
- `components/planilla/PlanillaRow.jsx`
- `components/planilla/SelectorTipoEvaluacion.jsx`
- `components/planilla/GestionTiposEvaluacion.jsx`
- `components/planilla/TablaNotasPlanilla.jsx`

### Admin

- `pages/OrdenBoletin.jsx`: raíz cargada por la pestaña de Administración para
  definir el orden de materias por curso, con flechas, posición numérica y
  guardado por curso.
- `pages/Admin.jsx`: la pestaña abierta vive en la dirección
  (`/admin?modulo=cursos`) desde el paso 4.2 del año lectivo (2026-10-03);
  las pestañas se ven igual.
- Año lectivo, paso 4.2: Cursos, Asignaciones, Orden boletín y los dos
  horarios cargan los datos del año que mira el admin (sus contenedores leen
  `useAnioLectivo()` y pasan `parametrosAnio` a sus hooks). Los botones siguen
  el estado de ese año: en uno en preparación se edita lo que ya existe, pero
  el formulario de Cursos no ofrece crear (un curso nuevo nacería en el año
  activo); en uno cerrado, `ListaCursos`, `HorarioCursoAsignacion` y
  `VistaOrdenBoletin` (prop `puedeEditar`) quedan solo para consultar, y no se
  muestran los formularios de curso ni de clase.

### Boletin

- `components/boletin/SeleccionBoletinAdministrativo.jsx`: filtros, tabla de
  estudiantes y acción para generar el boletín administrativo.
- `components/boletin/BoletinImprimible.jsx`: documento A4 con escalas,
  promedio, materias, observaciones y contrato de `DocumentoImprimible`.
- `components/boletin/VistaIngresoBoletinProfesor.jsx`: ingreso de
  observaciones del boletín final; oculta notas técnicas como `mas_alto` y
  protege etiquetas humanas con `translate="no"`. Durante un cambio de clase,
  espera que notas y observaciones pertenezcan a la misma consulta antes de
  mostrar cada tarjeta.
- `components/boletin/VistaOrdenBoletin.jsx`: controles y lista presentacional
  del orden de materias por curso.
- `pages/Boletin.jsx`, `pages/IngresoBoletinProfesor.jsx` y
  `pages/OrdenBoletin.jsx`: raíces de composición que conectan hooks y vistas.
- `hooks/boletines/`: consultas cancelables, edición, acciones masivas y
  comandos de guardado u orden.
- `services/boletinesApi.js`: frontera HTTP única del módulo.
- `utils/boletines/`: cálculos, normalización, filtros, movimientos y payloads
  puros.

### Certificados e impresión

- `components/certificadosImpresion/SeleccionCertificados.jsx`: encabezado,
  pestañas, filtros, estados y tabla controlada de estudiantes.
- `CertificadoNotasPreview.jsx`, `CertificadoMatriculaPreview.jsx` y
  `ReporteParcialPreview.jsx`: vistas A4 de los tres documentos, conectadas al
  wrapper compartido de impresión.
- `components/certificadosImpresion/admin/IdentidadInstitucionalView.jsx` y
  `PlantillasAdminView.jsx`: formularios administrativos controlados por props.
- `pages/CertificadosAdmin.jsx` y `pages/BrandingAdmin.jsx`: raíces de
  composición para generación y diseño de impresos. Branding conserva el
  montaje condicional de cada pestaña.
- `hooks/certificadosImpresion/`: carga y generación cancelables, comandos de
  branding y plantillas, y caché compartida de configuración de impresión.
- `services/certificadosImpresionApi.js`: fachada HTTP propia que reutiliza los
  contratos compatibles de boletines y asistencia.
- `services/printingService.js`: transporte compartido de branding, logos y
  plantillas.
- `utils/certificadosImpresion/`: filtros, cálculos, consolidación académica y
  contratos puros de los documentos.

### Estudiantes y observador

- `components/estudiantesObservador/admin/EncabezadoEstudiantesAdmin.jsx`:
  búsqueda, filtro operativo y apertura del formulario.
- `components/estudiantesObservador/admin/FormularioEstudianteAdmin.jsx`:
  formulario controlado de creación y edición.
- `components/estudiantesObservador/admin/ListaEstudiantesAdmin.jsx`: tabla,
  estado vacío y acciones por estudiante.
- `components/estudiantesObservador/admin/DetalleEstudianteAdmin.jsx`: modal
  responsive con resumen, rendimiento, deudas e inventario. Desde el 2026-09-10
  la sección «Observador» monta `ObservadorEnFichaAdmin`, no la tabla vieja.
- `components/estudiantesObservador/FormularioObservacionEstudiante.jsx` y
  `VistaPlanillaObservador.jsx`: formulario individual y planilla visual del
  observador del profesor.
- `pages/EstudiantesAdmin.jsx` y `pages/Formulario.jsx`: raíces de composición;
  `components/estudiantesObservador/Observaciones.jsx` conecta cada tarjeta con
  alertas e impresión.
- `hooks/estudiantesObservador/`: consultas aisladas, formularios y comandos.
  Incluye activación progresiva por visibilidad para evitar consultas masivas
  del observador.
- `services/estudiantesObservadorApi.js`: frontera HTTP única del módulo.
- `utils/estudiantesObservador/`: contratos y transformaciones puras.

### Observador del estudiante unificado

Módulo aparte del anterior **a propósito**: cuando el usuario ordene retirar la
pantalla vieja (`/Formulario`), esta no se va con ella. Ver
`docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md`.

- `pages/Observador.jsx`: raíz de composición. Lista los alumnos de la
  asignación con **una** petición y pide la bitácora de uno **al abrirlo**. Ahí
  muere el fallo de las doce peticiones simultáneas de la pantalla vieja.
- `components/observador/ListaAlumnosObservador.jsx`: solo nombres, agrupados
  por curso, con filtro local que no vuelve a consultar al servidor. **No
  depende de ninguna clase elegida** desde el 2026-09-09.
- `hooks/observador/useMisEstudiantes.js`: los alumnos del profesor, de todos
  sus cursos, en una sola petición. Sustituye a `usePlanillaObservador` en esta
  pantalla; la vieja lo sigue usando.
- `utils/observador/alumnos.js`: agrupación por curso, nombre completo y filtro,
  como contratos puros.
- `utils/observador/coloresProfesor.js`: un color por profesor, repartido por
  `profesor_id`. Las clases van literales porque Tailwind lee el código fuente.
- `components/observador/VistaObservadorEstudiante.jsx`: la bitácora agrupada
  por dimensión, con el nivel del curso en el título y el selector de periodo en
  «Todos». Cambiar la agrupación **no** dispara otra petición.
- `components/observador/AnotacionObservador.jsx`: una anotación bajo la
  dimensión en la que se muestra. **No pinta ningún botón de borrar**, en
  ninguna vista y para nadie.
- `components/observador/AnotacionCronologica.jsx`: la misma anotación en la
  vista por fecha, como una sola tarjeta que enumera sus dimensiones.
- `components/observador/EncabezadoAnotacion.jsx`: quién escribió y cuándo,
  compartido por las dos vistas para que no puedan decir cosas distintas.
- `components/observador/ObservadorImprimible.jsx`: el impreso, que reutiliza
  `DocumentoImprimible` con `tipo="observaciones"`. Sale lo que se está viendo;
  en papel no se pinta el color del profesor.
- `components/observador/ObservadorEnFichaAdmin.jsx`: conector que monta la
  vista del profesor dentro de la ficha del admin, en solo lectura y con la
  impresión limitada al documento general.
- `utils/observador/impresion.js`: qué anotaciones entran, las firmas de cada
  reporte y los títulos, como contratos puros. Incluye la lista recortada que ve
  un admin.
- `hooks/observador/useObservadorEstudiante.js`: la consulta, con descarte de
  respuestas obsoletas. Distingue el `404` («el estudiante no existe») de una
  lista vacía («todavía nadie le ha escrito nada»): son mensajes distintos.
- `services/observadorApi.js`: frontera HTTP. No expone contrato de borrado.
- `components/observador/FormularioAnotacionObservador.jsx`: los tres campos de
  siempre. Pide la corrección de mayúsculas **al salir del campo**, nunca al
  teclear. La marca de positiva o negativa se quitó el 2026-09-09. Se pinta una sola vez,
  arriba, tanto para una anotación nueva como para corregir una propia.
- `hooks/observador/useFormularioAnotacion.js`: estado editable, con la cuenta
  de qué campos tocó la profesora —la corrección solo se aplica a esos—.
- `hooks/observador/useComandosObservador.js`: crear y corregir. **No hay
  comando de borrado, y no debe añadirse.**
- `utils/observador/anotaciones.js`: agrupación por dimensión, periodo, fecha
  corta y título con nivel, como contratos puros.
- `utils/observador/formulario.js`: estado inicial, validación y cuerpos de las
  peticiones. El del `POST` **no** lleva `profesor_id`; el del `PUT` **no** lleva
  estudiante ni periodo.
- `utils/observador/texto.js`: la corrección de mayúsculas. Espejo comprobado de
  `app/core/texto_observador.py`.

### Constantes

- `constants/valoracionesDesarrollo.js`: opciones compartidas de desarrollo
  infantil (`Destacado`, `Logrado`, `En proceso`, `Requiere apoyo`) usadas por
  planilla y vistas relacionadas.

### Cartera

- `components/carteraTiposPago/VistaCarteraVencida.jsx`: carga, KPIs,
  distribución por curso, filtros, totales, tabla expandible y estados de
  cuenta A4 por estudiante o curso. Recibe datos y callbacks por props.
- `components/carteraTiposPago/VistaAdministrarTiposPago.jsx`: formulario,
  listado activo/inactivo, indicadores publicado/borrador, configuración
  financiera —incluidos mes inicial y mes final de los conceptos mensuales— y
  asignación responsive de cursos. Recibe estado y acciones por props.
- `Mes final` solo aparece al elegir cobro mensual. Sus opciones anteriores al
  mes inicial quedan deshabilitadas y la ayuda visible aclara: `Último mes que
  genera mensualidades y permite adelantos.`.
- `pages/CarteraVencidaAdmin.jsx` y `pages/TiposPagosAdmin.jsx`: raíces de
  composición del módulo.
- Año lectivo, paso 4.3 (2026-10-03): las dos pantallas cargan los datos del
  año que mira el admin (sus páginas leen `useAnioLectivo()` y pasan
  `parametrosAnio` a sus hooks). `VistaAdministrarTiposPago` recibe
  `puedeCrear` y `puedeEditar`: en un año en preparación no se ofrece crear,
  pero se edita lo que existe; en uno cerrado no hay ✏️, y la configuración
  se abre para mirar, con sus campos bloqueados y sin botones de guardar.
  `VistaCarteraVencida` recibe `puedeCobrar` (falso mirando otro año: Pagos
  cobra en el activo). Las dos props valen `true` si no llegan, como antes.
- `hooks/carteraTiposPago/`: consulta de cartera, consultas de conceptos,
  formulario básico, configuración y asignación de cursos.
- `services/carteraTiposPagoApi.js`: frontera HTTP única del módulo.
- `utils/carteraTiposPago/`: formatos, filtros, totales, CSV, contratos y
  payloads puros.

### Inventario y ventas

- `components/inventarioVentas/VistaInventario.jsx`: encabezado, alternancia y
  formulario de producto, filtro activo/inactivo/todos, tabla con insignias de
  stock y estado, estado vacío y spinner de carga inicial. Recibe datos y
  callbacks por props.
- `components/inventarioVentas/VistaVentas.jsx`: catálogo vendible, carrito con
  cantidades y subtotales, total, buscador de estudiantes con desplegable,
  historial de cargos con sus dos estados vacíos y acción de anular.
- `components/inventarioVentas/VolanteVenta.jsx`: vista imprimible del último
  cargo dentro de `components/impresion/DocumentoImprimible.jsx` con
  `tipo="volante_venta"`.
- `pages/InventarioAdmin.jsx` y `pages/VentasAdmin.jsx`: raíces de composición
  del módulo. `VentasAdmin` conserva además cuál de las dos pantallas muestra.
- `hooks/inventarioVentas/`: consulta del catálogo, consultas paralelas de la
  caja, formulario de producto, carrito y anulación.
- `services/inventarioVentasApi.js`: frontera HTTP única del módulo.
- `utils/inventarioVentas/`: contratos, payloads, filtros, totales y reglas de
  clase puras.
- El carrito nunca supera el `stock_actual` del producto y todo cargo se
  registra como `tipo_venta: "Credito"` sobre un estudiante; `Público General`
  sigue prohibido.
- Anular exige un motivo de al menos cinco caracteres y conserva la fila con su
  motivo visible.

### Nómina, egresos y préstamos

- `components/nominaEgresosPrestamos/EstadoCuentaPersonal.jsx`: tabla de todo el
  personal con documento, nombre, saldo de préstamos coloreado y el botón que
  abre el pago. Incluye su indicador de carga y su estado vacío.
- `components/nominaEgresosPrestamos/HistorialNomina.jsx`: buscador por empleado
  y tabla de pagos con sus dos estados vacíos: el que pide escribir un nombre y
  el que avisa que ese empleado no tiene pagos.
- `components/nominaEgresosPrestamos/ModalPagoNomina.jsx`: resumen del empleado
  con su deuda, los cinco campos del pago, el total neto y los tres botones. El
  campo de abono se deshabilita cuando no hay deuda.
- `components/nominaEgresosPrestamos/FormularioEgreso.jsx`: concepto, monto,
  categoría, fecha opcional y notas, con el encabezado y los botones que cambian
  entre registrar y actualizar.
- `components/nominaEgresosPrestamos/HistorialEgresos.jsx`: rango de fechas,
  botones `Buscar` y `Hoy`, total del rango, tabla y la distinción entre fila
  manual editable y fila `Automático`.
- `components/nominaEgresosPrestamos/FormularioPrestamo.jsx`: selector de
  profesor con documento, monto, fecha opcional y notas.
- `components/nominaEgresosPrestamos/HistorialPrestamos.jsx`: filtro por
  profesor, botones `Buscar` y `Limpiar`, total por cobrar, recuadro punteado
  inicial, tabla con insignia de estado y la acción `Saldar`.
- `pages\NominaAdmin.jsx`, `pages\EgresosAdmin.jsx` y `pages\PrestamosAdmin.jsx`:
  raíces de composición del módulo.
- `hooks/nominaEgresosPrestamos/`: consultas paralelas de nómina, egresos por
  rango, profesores con historial bajo demanda, y los comandos de pago, egreso y
  préstamo.
- `services/nominaEgresosPrestamosApi.js`: frontera HTTP única del módulo.
- `utils/nominaEgresosPrestamos/`: contratos, payloads, validaciones, fechas,
  totales y reglas de clase puras de los tres subflujos.
- El pago de nómina usa el sueldo del profesor como salario base, bloquea un
  neto negativo y un abono mayor que la deuda pendiente, y ante un error conserva
  el modal abierto con lo escrito.
- Los egresos automáticos que crea la nómina no se pueden editar desde esta
  pantalla; los préstamos no se eliminan y solo se pueden saldar.

### Pagos administrativos

- `pages/PagosAdmin.jsx` es la raíz de composición protegida para administración
  de pagos. Conecta hooks con componentes y conserva ruta, sesión, búsqueda,
  selección e impresión activa.
- `components/pagos/ListaEstudiantesPagos.jsx` presenta búsqueda controlada,
  carga, estado vacío y selección con documento y curso.
- `components/pagos/ValoresPersonalizadosPago.jsx` presenta el formulario y
  listado de ajustes individuales.
- `components/pagos/FormularioPago.jsx` presenta pago pendiente, cuotas,
  adelantos, distribución por monto y métodos combinados.
- `components/pagos/HistorialPagos.jsx` presenta pagos vigentes o anulados y
  delega impresión y anulación.
- `components/pagos/ComprobantePago.jsx` compone `FacturaModerna.jsx` dentro de
  `components/impresion/DocumentoImprimible.jsx`.
- `hooks/pagos/` separa catálogos, consultas por estudiante, opciones de
  adelanto, estado del formulario y comandos.
- `services/pagosApi.js` encapsula el transporte HTTP; `utils/pagos/` conserva
  contratos, formatos, cálculos y payloads puros.
- El módulo conserva el registro normal de deudas y cargos de inventario
  mediante `POST /pagos`.
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
  existe deuda vencida y bloquea valores que no caben antes del mes final del
  concepto. Diciembre es el valor compatible cuando el backend no entrega la
  nueva configuracion.
- `Subsidio` se ofrece como metodo identificable y deja la referencia como
  texto libre escrito por el usuario, sin entidades predefinidas.
- Los metodos de pago deben sumar el total calculado y el backend vuelve a
  validar meses, asignacion y valor vigente.
- Un error al consultar adelantos no impide usar el pago normal.
- `pages/ReportesAdmin.jsx` permite filtrar el detalle de ingresos por
  `Subsidio` y muestra su referencia, incluso dentro de pagos mixtos.

### Reportes financieros

- `pages/ReportesAdmin.jsx` es la raíz de composición protegida (`AdminRoute`
  más control de rol propio) del panel de reportes. Conecta
  `useReporteGeneral` y `useDetalleReportes` con los cuatro componentes del
  módulo y conserva solo el encabezado y las funciones que traducen una
  interacción en una llamada a los hooks.
- `components/reportesFinancieros/ResumenFinanciero.jsx` presenta las ocho
  tarjetas de estadísticas (ingresos, egresos y balance de hoy, balance
  general, estudiantes, profesores e ingresos/egresos acumulados).
- `components/reportesFinancieros/MovimientoMensual.jsx` presenta los
  últimos meses con ingreso, egreso, balance y barras de progreso
  proporcionales.
- `components/reportesFinancieros/RangoFechasPanel.jsx` presenta los campos
  de fecha, los botones `Ingresos`/`Egresos` y el panel de estudiantes por
  curso.
- `components/reportesFinancieros/DetalleReportes.jsx` presenta el panel de
  detalle: selector de medio de pago (solo ingresos), total según el filtro
  activo, y las tablas de ingresos o egresos con sus estados vacíos.
  Implementado con `React.forwardRef` para recibir el mismo `ref` que la
  página usa para el scroll automático al abrir un detalle.
- `hooks/reportesFinancieros/useReporteGeneral.js` separa la carga del
  reporte general (con recarga al volver a la pestaña) de sus derivados
  (`stats`, `estudiantesPorCurso`, `mesesFinancieros`).
- `hooks/reportesFinancieros/useDetalleReportes.js` separa la consulta de
  detalle por rango o por mes —con su validación de fechas y su scroll
  automático— de sus derivados de filtro y totales por medio de pago.
- `services/reportesFinancierosApi.js` encapsula el transporte HTTP;
  `utils/reportesFinancieros/` conserva la interpretación de medios de pago,
  los formateadores y la combinación de movimiento mensual.
- El módulo es solo de lectura: no existe capa de comandos ni formularios de
  escritura.
- Un pago con métodos combinados (`tipo_pago` unido con `" + "`) sin monto
  por método muestra, al filtrar por uno de esos medios, el monto **total**
  del pago; es comportamiento heredado del backend actual, caracterizado y
  conservado a propósito.

### Dashboards y rankings

- `components/dashboards/CumpleanosSemana.jsx`
- `components/dashboards/admin/AccesosAdmin.jsx`
- `components/dashboards/admin/TarjetaCarteraVencida.jsx`
- `components/dashboards/profesor/ContextoTrabajoProfesor.jsx`
- `components/dashboards/profesor/FiltroRendimiento.jsx`
- `components/dashboards/profesor/HorarioSemanal.jsx`
- `components/dashboards/profesor/PanelJornada.jsx`
- `components/dashboards/profesor/TablaRankingBajo.jsx`
- `components/dashboards/profesor/TablaRankingMejor.jsx`
- `components/dashboards/profesor/TarjetaBajoRendimiento.jsx`
- `components/dashboards/profesor/TarjetaInasistencias.jsx`
- `components/dashboards/profesor/TarjetaMejorRendimiento.jsx`
- `components/dashboards/superAdmin/ResumenTenants.jsx`
- `components/dashboards/superAdmin/TablaTenants.jsx`

Notas:

- `CumpleanosSemana` vive en la raíz porque lo comparten el panel de admin y el
  del profesor; cada uno le pasa su propio texto de estado vacío.
- Los componentes solo importan React y utilidades puras del módulo. No conocen
  hooks, servicios, Axios ni endpoints.
- `TablaRankingBajo` y `TablaRankingMejor` son hermanos, no variantes de un mismo
  componente: difieren en la columna de puesto, los colores, la insignia y el
  estado vacío. Lo mismo ocurre con `TarjetaBajoRendimiento`, cuyo color de
  promedio lo decide el backend, y `TarjetaMejorRendimiento`, donde es fijo.
- `PanelJornada` pinta una jornada completa con su vista móvil apilada y su
  rejilla de cinco días en escritorio.
- `AccesosAdmin` incluye la hoja de estilos de la animación de sus tarjetas, que
  respeta `prefers-reduced-motion`.

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
- `Boletin.jsx`
- `BrandingAdmin.jsx`
- `CarteraVencidaAdmin.jsx`
- `CambiarPassword.jsx`
- `CertificadosAdmin.jsx`
- `DashboardProfesor.jsx`
- `EgresosAdmin.jsx`
- `EstudiantesAdmin.jsx`
- `Formulario.jsx`
- `HorariosAdmin.jsx`
- `InventarioAdmin.jsx`
- `IngresoBoletinProfesor.jsx`
- `Login.jsx`
- `NominaAdmin.jsx`
- `OrdenBoletin.jsx`
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

- `hooks/autenticacion/`: lecturas y guards de sesión, consulta tenant y
  comandos de login, cambio de password y logout.
- `services/autenticacionApi.js`: frontera HTTP de `/login`, `/logout`,
  `/auth/cambiar-password` y `/tenant/status`.
- `utils/autenticacion/`: claves, contratos, validaciones, payloads,
  redirecciones y navegación puros.
- `hooks/anioLectivo/`: `AnioLectivoProvider` (carga los años una vez y
  guarda en memoria el que mira el admin), `useAnioLectivo` (fuera del
  proveedor, el comportamiento de antes) y `useAnioLectivoEnPantalla` (une el
  año con la pantalla abierta para el selector y el aviso).
- `services/aniosLectivosApi.js`: frontera HTTP de `/anios-lectivos`.
- `utils/anioLectivo.js`: contrato puro del año lectivo, con
  `parametrosAnio` (`{}` mirando el año activo).

- `hooks/asistencia/useConsultasAsistenciaProfesor.js`: carga cancelable de
  estudiantes, clases e historial.
- `hooks/asistencia/useComandosAsistenciaProfesor.js`: estado editable y ciclo
  de guardado de asistencia.
- `services/asistenciaApi.js`: frontera HTTP del módulo de asistencia.
- `hooks/planilla/useConsultasPlanillaProfesor.js`: carga cancelable de
  clases y planilla (estudiantes y columnas visibles).
- `hooks/planilla/useComandosPlanillaProfesor.js`: guardado de notas,
  valoraciones de desarrollo y alta/baja de tipos de evaluación.
- `services/planillaApi.js`: frontera HTTP del módulo de planilla.
- `utils/planilla/notas.js`: contratos y transformaciones puras de la
  planilla del profesor.
- `hooks/boletines/`: consultas y comandos de los tres flujos de boletines.
- `services/boletinesApi.js`: frontera HTTP del módulo de boletines.
- `utils/boletines/`: contratos y transformaciones puras del módulo.
- `hooks/administracionAcademica/`: consultas, disponibilidad, formularios y
  comandos de profesores, cursos, materias, asignaciones y horarios.
- `services/asignacionesApi.js`, `profesoresApi.js`, `cursosApi.js`,
  `materiasApi.js` y `horariosApi.js`: fronteras HTTP del módulo académico.
- `utils/administracionAcademica/`: contratos y transformaciones puras del
  módulo, con pruebas junto a cada entidad.
- `hooks/estudiantesObservador/`: consultas, formularios y comandos del listado,
  detalle, planilla y observaciones.
- `services/estudiantesObservadorApi.js`: frontera HTTP única de estudiantes y
  observador.
- `utils/estudiantesObservador/`: contratos, filtros, normalización y payloads
  puros del módulo.
- `hooks/certificadosImpresion/usePrintConfig.js`: implementación única de la
  caché de branding y plantilla activa por tipo, importada directamente por sus
  consumidores.
- `hooks/certificadosImpresion/`: consultas y comandos de certificados,
  identidad institucional y plantillas.
- `services/certificadosImpresionApi.js`: frontera HTTP propia de certificados.
- `services/printingService.js`: servicio para branding, plantillas e impresion.
- `utils/certificadosImpresion/`: contratos y transformaciones puras del
  módulo.
- `hooks/carteraTiposPago/`: consultas, fallback, detalle, formularios y
  comandos de cartera y conceptos.
- `services/carteraTiposPagoApi.js`: frontera HTTP de cartera vencida, tipos de
  pago, configuración y cursos.
- `utils/carteraTiposPago/`: transformaciones y payloads puros del módulo.
- `hooks/pagos/`: consultas, formularios y comandos del módulo de pagos.
- `services/pagosApi.js`: frontera HTTP única de pagos.
- `utils/pagos/`: formatos, cálculos, normalización y payloads puros de pagos.
- `hooks/reportesFinancieros/`: consulta del reporte general (con sus
  derivados) y consulta del detalle por rango o mes (con sus derivados de
  filtro y totales). Sin comandos: el módulo es de solo lectura.
- `services/reportesFinancierosApi.js`: frontera HTTP única de reportes
  financieros.
- `utils/reportesFinancieros/`: interpretación de medios de pago, formatos y
  combinación de movimiento mensual puros del módulo.
- `hooks/inventarioVentas/`: catálogo con filtro por estado, consultas paralelas
  de la caja, formulario de producto, carrito y anulación de cargos.
- `services/inventarioVentasApi.js`: frontera HTTP única de inventario y ventas.
- `utils/inventarioVentas/`: contratos, payloads, filtros, totales y reglas de
  clase puras del módulo.
- `hooks/nominaEgresosPrestamos/`: consultas de nómina, egresos y préstamos, y
  comandos de pago de nómina, formulario de egreso y alta y saldado de préstamos.
- `services/nominaEgresosPrestamosApi.js`: frontera HTTP única de nómina,
  egresos y préstamos.
- `utils/nominaEgresosPrestamos/`: contratos, payloads, validaciones, fechas,
  totales y reglas de clase puras del módulo.
- `hooks/dashboards/`: once hooks, uno por sección independiente. Del admin,
  `useDashboardAdmin`. Del profesor, `useContextoProfesor`, `useClasesProfesor`,
  `useInasistenciasProfesor`, `useCumpleanosProfesor`, `useRendimientoProfesor`,
  `usePlaneacionesRecientes` y `useRankingProfesor` con sus dos envoltorios. Del
  super admin, `useTenants`, `useAltaTenant` y `useEstadoTenant`.
- `services/dashboardsApi.js`: frontera HTTP única de los dashboards por rol y
  de los dos rankings del profesor.
- `utils/dashboards/`: un archivo por subdominio —`admin.js`, `profesor.js`,
  `superAdmin.js` y `cumpleanos.js`, este último compartido por dos roles— con
  contratos, transformaciones, validaciones y reglas de clase puras.
- `utils/api.js`: cliente Axios compartido e interceptor global de `401`;
  reutiliza decisiones puras de sesión y permanece como dependencia
  transversal.

## Estilos

- `src/index.css`: estilos globales cargados desde `main.jsx`.
- `styles/print.css`: estilos para impresion.

En computador, `styles/print.css` dibuja la hoja en pantalla con las mismas
medidas del papel impreso: ancho carta/oficio, orilla blanca de 8 mm, marco y
el margen de la plantilla medido desde la orilla del papel. Al imprimir no
fija tamaño de papel (se elige en la ventana de imprimir), salvo que la
plantilla elija uno en "Tamaño del papel" (`config_json.tamano_papel`).

`styles/print.css` contiene tambien las reglas moviles de documentos imprimibles:

- documentos comunes: se adaptan al ancho disponible;
- boletin/certificados/cartera: mantienen `210mm` de ancho y se desplazan
  horizontalmente en pantallas pequenas.
