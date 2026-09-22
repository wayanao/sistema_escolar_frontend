# Prompt de continuación: Listas de Seguimiento por Curso

Este prompt es para retomar esta propuesta específica en un chat nuevo o con
otro LLM — no es el prompt general del programa de modularización. Sirve
tanto si el chat nuevo abre este repo (`frontend-react`), el de
`sistema_escolar_api`, o ambos.

Este mismo archivo existe, con el mismo contenido, en
`sistema_escolar_api/docs/funcionalidades/PROMPT_CONTINUACION_LISTAS_SEGUIMIENTO.md`.
Si difieren, avisa y no continúes hasta resolver la discrepancia.

```text
Vamos a continuar la propuesta "Listas de Seguimiento por Curso".

Antes de nada, declara tu modo de acceso:
- si tienes el checkout local de sistema_escolar_api, frontend-react, o
  ambos;
- si solo ves uno de los dos repos, dilo explícitamente: esta propuesta toca
  ambos y no debe implementarse la mitad de un lado sin saber el estado del
  otro.

Lee completamente, en este orden:
1. sistema_escolar_api/docs/funcionalidades/LISTAS_SEGUIMIENTO.md
2. frontend-react/docs/funcionalidades/LISTAS_SEGUIMIENTO.md

Esto NO es una capa del programa de modularización de
docs/modularizacion/ ni un módulo de la migración arquitectónica del
frontend. Es una función nueva de producto, documentada aparte a propósito.
No la mezcles con esos índices ni actualices docs/modularizacion/README.md
por esto.

Antes de escribir una sola línea de código:
1. Confirma en cada repo que estás en main y que git status está limpio.
2. Confirma, leyendo la sección "Entrega para el siguiente chat" de cada
   documento, cuál fue la última fase terminada. Si dice "ninguna", no hay
   código de esta propuesta todavía: no asumas lo contrario.
3. Revisa la sección "Preguntas abiertas" de ambos documentos. Si alguna
   sigue sin respuesta del usuario, pregúntale antes de tomar una decisión
   por tu cuenta. No la infieras ni elijas la opción que te parezca mejor.
4. Confirma que el usuario autoriza explícitamente empezar (o continuar) la
   fase que corresponda. Una instrucción genérica como "continúa" no basta
   si ninguna fase se ha iniciado todavía: confirma primero qué fase exacta
   autoriza.

Reglas de trabajo, iguales a las de cualquier módulo de este proyecto:
- Backend primero: las tablas `listas_seguimiento_columnas` /
  `listas_seguimiento_marcas` y sus endpoints deben existir y estar
  verificados (`scripts/verify.py`) antes de que el frontend dependa de
  ellos.
- Un paso del plan de fases a la vez. No inicies el siguiente sin cerrar y
  verificar el actual.
- Antes de cualquier extracción o cambio de comportamiento, agrega o
  conserva pruebas de caracterización.
- No agregues funciones que no estén en el documento (reutilizar columnas
  entre cursos, valores distintos de check+nota, período/año lectivo,
  reordenar columnas): esas puertas se cerraron a propósito, ver
  "Decisiones ya tomadas" y "Fuera de alcance" en cada documento.
- No toques `notas_detalle`, `asistencia`, `tipos_de_pagos` ni ningún
  módulo ya modularizado — esta funcionalidad no depende de ninguno de
  ellos.
- No rediseñes pantallas no mencionadas ni toques el menú admin más allá de
  agregar la entrada nueva en los dos archivos
  (`navegacion.js` y `NavAdminView.jsx`).

Al terminar un paso:
- ejecuta las pruebas específicas y la verificación global de ese repo
  (scripts/verify.py en el backend; pnpm run check:deploy en el frontend);
- ejecuta git diff --check;
- actualiza el documento LISTAS_SEGUIMIENTO.md correspondiente con lo que
  se hizo, su verificación, y la siguiente acción exacta;
- informa cuál es el siguiente paso, pero no lo inicies.

No hagas commit, push, deploy, migraciones reales contra los tenants ni
acceso a producción. El usuario revisa los cambios, hace el commit y
controla la publicación — dale siempre un mensaje de commit sugerido al
cerrar un paso, aunque no lo pida.

Si un resumen de otro chat o asistente contradice lo que dicen los
documentos o `git status`, prevalece lo que puedes verificar tú mismo, no el
resumen.
```
