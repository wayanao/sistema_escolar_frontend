# Prompt de continuación: Entrevista de admisión

Este prompt es para retomar esta funcionalidad en un chat nuevo o con otro
LLM. No es el prompt general del programa de modularización. Sirve tanto si
el chat nuevo abre este repo, el otro o ambos.

Este mismo archivo existe, con el mismo contenido, en
`sistema_escolar_api/docs/funcionalidades/PROMPT_CONTINUACION_ENTREVISTA_ADMISION.md`
y en `frontend-react/docs/funcionalidades/PROMPT_CONTINUACION_ENTREVISTA_ADMISION.md`.
Si difieren, avisa y no continúes hasta resolver la discrepancia.

```text
Vamos a continuar la funcionalidad "Entrevista de admisión".

Antes de nada, declara tu modo de acceso:
- si tienes el checkout local de sistema_escolar_api, frontend-react, o
  ambos;
- si solo ves uno de los dos repos, dilo explícitamente: esta
  funcionalidad toca ambos y no debe implementarse la mitad de un lado sin
  saber el estado del otro.

Lee completamente, en este orden:
1. sistema_escolar_api/docs/funcionalidades/ENTREVISTA_ADMISION.md (el
   principal)
2. frontend-react/docs/funcionalidades/ENTREVISTA_ADMISION.md
3. El CLAUDE.md de cada repo que vayas a tocar.
4. sistema_escolar_api/docs/MIGRACIONES.md si el paso toca migraciones.
5. De sistema_escolar_api/docs/funcionalidades/ANIO_LECTIVO.md, lo que toque
   al año en preparación: esta funcionalidad vive ahí.

Esto NO es una capa del programa de modularización de docs/modularizacion/
ni un módulo de la migración arquitectónica del frontend. Es una función
nueva de producto, documentada aparte a propósito. No la mezcles con esos
índices.

Antes de escribir una sola línea de código:
1. Confirma en cada repo que estás en main y que git status está limpio.
2. Confirma, leyendo "Entrega para el siguiente chat" de cada documento,
   cuál fue el último paso terminado (E0 a E7). Si dice "diseño y
   documentación", no hay código de esta funcionalidad todavía: no asumas
   lo contrario.
3. Revisa "Preguntas abiertas". Si alguna que afecta al paso siguiente
   sigue sin respuesta, pregúntale al usuario. No la infieras ni elijas por
   tu cuenta. En particular, el reparto de campos entre la ficha del
   estudiante y la entrevista es una propuesta que el usuario debe
   confirmar antes de E1.
4. Confirma que el usuario autoriza explícitamente el paso exacto que vas a
   empezar. Un "continúa" genérico no basta si el paso no se ha iniciado.

Reglas de esta funcionalidad:
- El orden de pasos es obligatorio. E7 (bloquear el alta directa en el año
  en preparación) va al final, después de que el frontend nuevo (E5) esté
  en producción; si no, el botón de siempre fallaría.
- Solo para estudiantes nuevos del año en preparación. La promoción de
  quien continúa no cambia.
- Datos de menores (Ley 1581 de 2012): la autorización de datos es
  obligatoria y el acceso es solo del admin. No se piden datos que puedan
  discriminar (religión, estado civil de los padres, etc.); "No aprobado"
  exige el motivo.
- estudiantes.documento_identidad es único en todo el colegio: un
  aspirante que ya fue estudiante choca al matricularse como nuevo. Está en
  "Preguntas abiertas".
- No se borra ninguna columna de estudiantes sin permiso explícito.
- Migraciones: cambio mínimo, pruebas primero, se prueban en una rama de
  Neon, el esquema base se regenera desde allí y el usuario las aplica.
- El frontend no decide reglas de admisión: las decide el backend.
- No agregues funciones que no estén en los documentos. No rediseñes
  pantallas no mencionadas.

Al terminar un paso:
- corre las pruebas específicas y la verificación global del repo
  (python scripts/verify.py en el backend; pnpm run check:deploy en el
  frontend) y git diff --check;
- actualiza el ENTREVISTA_ADMISION.md correspondiente: qué se hizo, cómo se
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
