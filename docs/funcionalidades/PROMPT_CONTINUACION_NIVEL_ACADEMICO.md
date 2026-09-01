# Prompt de continuación: Nivel académico (Preescolar y Primaria)

Este prompt es para retomar esta propuesta específica en un chat nuevo o con
otro LLM — no es el prompt general del programa de modularización. Sirve
tanto si el chat nuevo abre este repo (`sistema_escolar_api`), el de
`frontend-react`, o ambos.

Este mismo archivo existe, con el mismo contenido, en
`frontend-react/docs/funcionalidades/PROMPT_CONTINUACION_NIVEL_ACADEMICO.md`.
Si difieren, avisa y no continúes hasta resolver la discrepancia.

```text
Vamos a continuar la propuesta "Nivel académico (Preescolar y Primaria)".

Antes de nada, declara tu modo de acceso:
- si tienes el checkout local de sistema_escolar_api, frontend-react, o
  ambos;
- si solo ves uno de los dos repos, dilo explícitamente: esta propuesta toca
  ambos y no debe implementarse la mitad de un lado sin saber el estado del
  otro.

Lee completamente, en este orden:
1. sistema_escolar_api/docs/funcionalidades/NIVEL_ACADEMICO.md
2. frontend-react/docs/funcionalidades/NIVEL_ACADEMICO.md

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
- Backend primero: la columna `cursos.nivel` y su validación en el servidor
  deben existir antes de que el frontend dependa de ellas.
- Un paso del plan de fases a la vez. No inicies el siguiente sin cerrar y
  verificar el actual.
- Antes de cualquier extracción o cambio de comportamiento, agrega o conserva
  pruebas de caracterización.
- No agregues funciones que no estén en el documento, no rediseñes pantallas
  no mencionadas, no toques otros módulos ya modularizados salvo lo descrito
  aquí.
- La regla de tipo de evaluación por nivel se valida en el backend, no solo
  en la pantalla. No aceptes una implementación que solo oculte el selector
  en el frontend sin la validación equivalente en el servidor.
- Ningún dato histórico de notas o asistencia se modifica por este cambio.
  Un curso sin nivel definido se comporta exactamente como hoy.

Al terminar un paso:
- ejecuta las pruebas específicas y la verificación global de ese repo
  (scripts/verify.py en el backend; pnpm run check:deploy en el frontend);
- ejecuta git diff --check;
- actualiza el documento NIVEL_ACADEMICO.md correspondiente con lo que se
  hizo, su verificación, y la siguiente acción exacta;
- informa cuál es el siguiente paso, pero no lo inicies.

No hagas commit, push, deploy, migraciones reales contra los tenants ni
acceso a producción. El usuario revisa los cambios, hace el commit y
controla la publicación — dale siempre un mensaje de commit sugerido al
cerrar un paso, aunque no lo pida.

Si un resumen de otro chat o asistente contradice lo que dicen los
documentos o `git status`, prevalece lo que puedes verificar tú mismo, no el
resumen.
```
