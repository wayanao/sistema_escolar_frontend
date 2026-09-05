# Prompt de continuación: Observador del estudiante unificado

Este prompt es para retomar esta propuesta específica en un chat nuevo o con
otro LLM — no es el prompt general del programa de modularización. Sirve tanto
si el chat nuevo abre este repo (`sistema_escolar_api`), el de `frontend-react`,
o ambos.

Este mismo archivo existe, con el mismo contenido, en
`sistema_escolar_api/docs/funcionalidades/PROMPT_CONTINUACION_OBSERVADOR_ESTUDIANTE.md`.
Si difieren, avisa y no continúes hasta resolver la discrepancia.

```text
Vamos a continuar la propuesta "Observador del estudiante unificado".

Antes de nada, declara tu modo de acceso:
- si tienes el checkout local de sistema_escolar_api, frontend-react, o ambos;
- si solo ves uno de los dos repos, dilo explícitamente: esta propuesta toca
  ambos y no debe implementarse la mitad de un lado sin saber el estado del
  otro.

Lee completamente, en este orden:
1. sistema_escolar_api/docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md
2. frontend-react/docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md
3. sistema_escolar_api/docs/CAMBIOS_BACKEND.md, entrada del 2026-09-03
   (contexto de rendimiento medido: por qué esta funcionalidad existe)

Esto NO es una capa del programa de modularización de docs/modularizacion/ ni
un módulo de la migración arquitectónica del frontend. Es una función nueva de
producto, documentada aparte a propósito. No la mezcles con esos índices ni
actualices docs/modularizacion/README.md por esto. La capa 7 de
`observaciones` está CERRADA desde el 2026-08-21 y esta propuesta no la
reabre.

CONTEXTO EN UNA FRASE
El observador actual guarda una casilla por estudiante, materia y periodo, y
la sobrescribe en cada guardado. Se sustituye por una bitácora acumulativa por
estudiante, independiente de la materia, donde cada profesor que tenga a ese
alumno deja anotaciones fechadas y todas quedan.

ESTADO AL ESCRIBIR ESTE PROMPT (2026-09-04)
- Nada implementado. No hay tabla, migración, endpoint, página ni prueba.
- La pantalla vieja sigue en producción, y el fallo que el usuario reportó
  ("No pudimos recuperar la observación guardada") SIGUE VIVO. Es
  intermitente: con 2 peticiones simultáneas tarda 8-9,7 s y el límite del
  frontend son 10 s.
- Trabajo previo YA COMMITEADO Y PUBLICADO que NO pertenece a esta propuesta:
  una optimización del 2026-09-03 en app/dependencies.py,
  app/core/permissions.py, app/routes/observaciones.py y tres archivos de
  prueba (commits efb7f91 y 71e1b44, en main desde el 2026-09-04, es decir ya
  desplegados). Baja la lectura un 10% y NO arregla el fallo. No lo deshagas ni
  lo confundas con esta funcionalidad.

ANTES DE ESCRIBIR UNA SOLA LÍNEA DE CÓDIGO
1. Confirma en cada repo que estás en main y que git status está limpio (o que
   el usuario sabe lo que hay pendiente, ver punto anterior).
2. Lee la sección "Entrega para el siguiente chat" de cada documento y confirma
   cuál fue la última fase terminada. Si dice "ninguna", no hay código de esta
   propuesta todavía: no asumas lo contrario.
3. Revisa la sección "Preguntas abiertas" de ambos documentos. Si alguna sigue
   sin respuesta del usuario, PREGÚNTALE antes de decidir por tu cuenta. No la
   infieras ni elijas la opción que te parezca mejor.
4. Confirma que el usuario autoriza explícitamente empezar (o continuar) la
   fase que corresponda. Una instrucción genérica como "continúa" no basta si
   ninguna fase se ha iniciado todavía: confirma primero qué fase exacta
   autoriza.

REGLAS DE TRABAJO
- Backend primero. La tabla y el endpoint de lectura deben existir antes de que
  el frontend dependa de ellos.
- Una fase a la vez. No inicies la siguiente sin cerrar y verificar la actual.
- Antes de cualquier cambio de comportamiento, agrega o conserva pruebas que lo
  fijen. En sistema_escolar_api la compuerta es
  `.\venv\Scripts\python.exe scripts\verify.py` y debe quedar en verde.
- En sistema_escolar_api, `git push origin main` DESPLIEGA PRODUCCIÓN
  AUTOMÁTICAMENTE. Cualquier migración se aplica ANTES de publicar código que
  dependa de ella.
- El usuario hace sus propios commits. Entrégale el mensaje de commit redactado,
  sin que lo pida, y no commitees por él salvo que te lo ordene.

LAS SEIS DECISIONES QUE NO DEBES REABRIR
Las tomó el usuario el 2026-09-04. Si crees que alguna está mal, dilo, pero no
la cambies por tu cuenta:

1. TABLA NUEVA, no reutilizar `observaciones`. Su UNIQUE impide varias
   anotaciones, no tiene fecha ni autor, y su clave foránea tiene
   ON DELETE CASCADE hacia asignaciones: borrar una asignación borraría
   historial del alumno. Además, con tabla nueva la pantalla vieja sigue
   funcionando y se puede volver atrás.
2. NADIE BORRA anotaciones. No existe endpoint DELETE y no debe añadirse.
3. SOLO EL AUTOR EDITA la suya, y editar deja rastro (editada_en,
   editada_por).
4. EL ADMIN VE TODO PERO NO EDITA anotaciones de profesores. Esto es una
   EXCEPCIÓN DELIBERADA a la norma del proyecto: casi todos los guards
   empiezan con `if current_user.get("rol") == "admin": return`. En el guard de
   edición NO lo pongas. Debe haber una prueba que lo impida. Motivo: si el
   coordinador puede reescribir lo que anotó una profesora, la bitácora deja de
   servir como documento ante una reclamación.
5. SE MANTIENEN LOS TRES CAMPOS (conductual, cognitivo, lenguaje) y cada
   anotación se marca positiva o negativa.
6. EL PERIODO ES UNA ETIQUETA, no un filtro obligatorio. Cambiar de periodo
   nunca oculta historial; siempre existe la opción "Todos".

LA TRAMPA MULTI-INQUILINO QUE HAY QUE EVITAR
Este proyecto usa UN SCHEMA DE POSTGRESQL POR COLEGIO. Todo cambio de
estructura hay que repetirlo en cada uno, y el que se salte uno queda distinto
para siempre. Ya pasó: la misma restricción se llama `unique_observacion` en
tenant_colegio_1 y `observaciones_estudiante_id_asignacion_id_periodo_key` en
tenant_2005.

Por eso, el índice nuevo va en DOS sitios o quedará incompleto:
- scripts/apply_tenant_indexes.py, para los colegios que ya existen;
- migrations/base/20260813_esquema_base_tenant.sql, para los que se creen
  después.

Comprueba que haces las dos cosas. La tabla `observaciones` actual es el
ejemplo de lo que pasa si no: no está en apply_tenant_indexes.py aunque su
gemela `asistencia` sí.

CÓMO MEDIR SI DUDAS DEL RENDIMIENTO
No extrapoles de /health ni razones sobre qué consulta "parece cara": en este
proyecto la base está en Neon (us-east-1) y CADA ida y vuelta cuesta ~180 ms,
se consulte lo que se consulte. Lo que predice el tiempo es el NÚMERO de idas
y vueltas, no la complejidad del SQL.

Para medir un endpoint autenticado de verdad:
1. localiza en la base un caso real (estudiante, asignación, profesor, tenant);
2. acuña un token con app.security.create_access_token({"sub": <id>,
   "rol": "profesor", "tenant": "<schema>"}) usando el venv del proyecto;
3. llámalo con curl cronometrado, en solitario Y en paralelo.

El backend local NO acerca la base: "es local" no significa "es rápido".

CÓMO HABLAR CON ESTE USUARIO
Está aprendiendo y lo dice él mismo. Pide respuestas cortas, sin tecnicismos y
explícitas, y ha dicho que tiene miedo de cometer errores.
- Ve directo a la conclusión. Explica cada término técnico con palabras
  normales la primera vez que aparece.
- Dile explícitamente qué es seguro y qué no ha roto. Un hallazgo sin ese
  contexto lo lee como culpa suya.
- Separa "esto hay que arreglarlo ya" de "esto es deuda anotada, no corre
  prisa".
- Una sola pregunta a la vez, de sí o no, en lenguaje de producto ("las tres
  casillas que ve la profesora"), no de base de datos ("las columnas de la
  tabla").
- Los detalles largos van a la bitácora del repositorio, no al chat.

QUÉ NO HACER
- No subir el timeout de 10 s del frontend. Cambiaría "sale un error" por "la
  página tarda 20 segundos", que es peor. Decidido con el usuario.
- No implementar el endpoint masivo GET /observaciones/{asignacion_id}/{periodo}
  que se propuso el 2026-09-03. Esta funcionalidad lo vuelve innecesario.
- No borrar la tabla `observaciones` ni sus 51 filas. Se jubila, no se elimina.
- No tocar el sobrecoste de autenticación (6 idas y vueltas por petición). Es
  un defecto real y transversal, pero exige su propio alcance y su propia
  orden.
```
