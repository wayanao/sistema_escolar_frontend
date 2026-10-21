# Prompt de continuación: Subnotas y porcentajes en la planilla

Este prompt es para retomar esta funcionalidad en un chat nuevo o con otro
LLM. No es el prompt general del programa de modularización. Sirve tanto si
el chat nuevo abre este repo, el otro o ambos.

Este mismo archivo existe, con el mismo contenido, en
`sistema_escolar_api/docs/funcionalidades/PROMPT_CONTINUACION_SUBNOTAS_PLANILLA.md`
y en `frontend-react/docs/funcionalidades/PROMPT_CONTINUACION_SUBNOTAS_PLANILLA.md`.
Si difieren, avisa y no continúes hasta resolver la discrepancia.

```text
Vamos a continuar la funcionalidad "Subnotas y porcentajes en la planilla".

Antes de nada, declara tu modo de acceso:
- si tienes el checkout local de sistema_escolar_api, frontend-react, o
  ambos;
- si solo ves uno de los dos repos, dilo explícitamente: esta
  funcionalidad toca ambos y no debe implementarse la mitad de un lado sin
  saber el estado del otro.

Lee completamente, en este orden:
1. sistema_escolar_api/docs/funcionalidades/SUBNOTAS_PLANILLA.md (el
   principal)
2. frontend-react/docs/funcionalidades/SUBNOTAS_PLANILLA.md
3. El CLAUDE.md de cada repo que vayas a tocar.
4. sistema_escolar_api/docs/MIGRACIONES.md si el paso toca migraciones.

Esto NO es una capa del programa de modularización de docs/modularizacion/
ni un módulo de la migración arquitectónica del frontend. Es una función
nueva de producto, documentada aparte a propósito. No la mezcles con esos
índices.

Antes de escribir una sola línea de código:
1. Confirma en cada repo que estás en main y que git status está limpio.
2. Confirma, leyendo "Entrega para el siguiente chat" de cada documento,
   cuál fue el último paso terminado (A0 a A5, B0 a B5). Si dice "diseño",
   no hay código de esta funcionalidad todavía: no asumas lo contrario.
3. Revisa "Preguntas abiertas" y "Propuestas de este diseño". Si alguna
   que afecta al paso siguiente sigue sin respuesta o sin visto bueno,
   pregúntale al usuario. No la infieras ni elijas por tu cuenta.
4. Confirma que el usuario autoriza explícitamente el paso exacto que vas a
   empezar. Un "continúa" genérico no basta si el paso no se ha iniciado.

Reglas de esta funcionalidad:
- Orden obligatorio: toda la parte A (subnotas) publicada antes de empezar
  la parte B (porcentajes por tipo de nota).
- Las subnotas nunca se guardan en notas_detalle. La celda (su promedio) sí,
  y solo la calcula y la escribe el servidor.
- Sin subnotas, cada respuesta del backend y cada petición del frontend
  deben quedar idénticas a las de hoy. Pruébalo con caracterización antes de
  cambiar.
- La parte B cambia la nota oficial del periodo (boletín, reporte parcial,
  puesto): es zona sensible. Cambio mínimo, pruebas primero y explicación al
  usuario antes de tocar.
- La escala de caritas vive en los dos repos. Si cambia, cambia en ambos,
  con su prueba gemela.
- Migraciones: cambio mínimo, pruebas primero, se prueban en una rama de
  Neon, el esquema base se regenera desde allí y el usuario las aplica.
- Orden de publicación de la parte A: migración en producción, backend
  (Render Live), frontend. Entre la migración y el push del backend no se
  crean colegios nuevos.
- Las pruebas en local se hacen con el Colegio Demo, nunca con estudiantes
  de tenant_2005: el backend local escribe en la base real.
- El frontend no decide la nota: muestra una vista previa, pero lo guardado
  lo calcula el backend.
- No agregues funciones que no estén en los documentos. No rediseñes
  pantallas no mencionadas.

Al terminar un paso:
- corre las pruebas específicas y la verificación global del repo
  (python scripts/verify.py en el backend; pnpm run check:deploy en el
  frontend) y git diff --check;
- actualiza el SUBNOTAS_PLANILLA.md correspondiente: qué se hizo, cómo se
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
