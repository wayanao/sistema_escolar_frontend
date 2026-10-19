# Prompt de continuación: SISBÉN y lugar de residencia

Este prompt es para retomar esta funcionalidad en un chat nuevo o con otro
LLM. No es el prompt general del programa de modularización. Sirve tanto si
el chat nuevo abre este repo, el otro o ambos.

Este mismo archivo existe, con el mismo contenido, en
`sistema_escolar_api/docs/funcionalidades/PROMPT_CONTINUACION_SISBEN_RESIDENCIA.md`
y en `frontend-react/docs/funcionalidades/PROMPT_CONTINUACION_SISBEN_RESIDENCIA.md`.
Si difieren, avisa y no continúes hasta resolver la discrepancia.

```text
Vamos a continuar la funcionalidad "SISBÉN y lugar de residencia".

Antes de nada, declara tu modo de acceso:
- si tienes el checkout local de sistema_escolar_api, frontend-react, o
  ambos;
- si solo ves uno de los dos repos, dilo explícitamente: esta
  funcionalidad toca ambos y no debe implementarse la mitad de un lado sin
  saber el estado del otro.

Lee completamente, en este orden:
1. sistema_escolar_api/docs/funcionalidades/SISBEN_RESIDENCIA.md (el
   principal)
2. frontend-react/docs/funcionalidades/SISBEN_RESIDENCIA.md
3. El CLAUDE.md de cada repo que vayas a tocar.
4. sistema_escolar_api/docs/MIGRACIONES.md si el paso toca migraciones.

Esto NO es una capa del programa de modularización de docs/modularizacion/
ni un módulo de la migración arquitectónica del frontend. Es una función
nueva de producto, documentada aparte a propósito. No la mezcles con esos
índices.

Antes de escribir una sola línea de código:
1. Confirma en cada repo que estás en main y que git status está limpio.
2. Confirma, leyendo "Entrega para el siguiente chat" de cada documento,
   cuál fue el último paso terminado (S0 a S3). Si dice "diseño", no hay
   código de esta funcionalidad todavía: no asumas lo contrario.
3. Revisa "Preguntas abiertas". Si alguna que afecta al paso siguiente
   sigue sin respuesta, pregúntale al usuario. No la infieras ni elijas por
   tu cuenta.
4. Confirma que el usuario autoriza explícitamente el paso exacto que vas a
   empezar. Un "continúa" genérico no basta si el paso no se ha iniciado.

Reglas de esta funcionalidad:
- La tupla de 34 valores de insertar_estudiante y actualizar_estudiante no
  se toca: las columnas nuevas se escriben aparte, en la misma transacción,
  y solo si llegó alguno de los ocho campos nuevos.
- Una pestaña vieja (sin los campos nuevos) no borra lo guardado.
- Lo que ya está escrito en estudiantes.direccion no se parte ni se borra.
- Solo el admin ve y edita estos datos (datos de menores, Ley 1581 de 2012).
- Migraciones: cambio mínimo, pruebas primero, se prueban en una rama de
  Neon, el esquema base se regenera desde allí y el usuario las aplica.
- Orden de publicación: backend (Render Live), migración en producción,
  frontend.
- El frontend no decide reglas: el backend valida todo.
- No agregues funciones que no estén en los documentos. No rediseñes
  pantallas no mencionadas.

Al terminar un paso:
- corre las pruebas específicas y la verificación global del repo
  (python scripts/verify.py en el backend; pnpm run check:deploy en el
  frontend) y git diff --check;
- actualiza el SISBEN_RESIDENCIA.md correspondiente: qué se hizo, cómo se
  verificó y la siguiente acción exacta;
- informa cuál es el siguiente paso, pero no lo inicies.

No hagas commit, push, deploy, migraciones reales contra los tenants ni
acceso a producción. Un push a main del backend despliega a producción
automáticamente. El usuario revisa, hace el commit y controla la
publicación. Dale siempre un mensaje de commit sugerido al cerrar un paso,
aunque no lo pida.

El usuario está aprendiendo: explica en palabras simples, sin jerga, y
cuenta el porqué de cada decisión.

Si un resumen de otro chat contradice los documentos o git status,
prevalece lo que puedas verificar tú mismo.
```
