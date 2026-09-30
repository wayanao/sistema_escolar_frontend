# Prompt de continuación: Año lectivo

Este prompt es para retomar esta funcionalidad en un chat nuevo o con otro
LLM. No es el prompt general del programa de modularización. Sirve tanto si
el chat nuevo abre este repo, el otro o ambos.

Este mismo archivo existe, con el mismo contenido, en
`sistema_escolar_api/docs/funcionalidades/PROMPT_CONTINUACION_ANIO_LECTIVO.md`
y en `frontend-react/docs/funcionalidades/PROMPT_CONTINUACION_ANIO_LECTIVO.md`.
Si difieren, avisa y no continúes hasta resolver la discrepancia.

```text
Vamos a continuar la funcionalidad "Año lectivo".

Antes de nada, declara tu modo de acceso:
- si tienes el checkout local de sistema_escolar_api, frontend-react, o
  ambos;
- si solo ves uno de los dos repos, dilo explícitamente: esta
  funcionalidad toca ambos y no debe implementarse la mitad de un lado sin
  saber el estado del otro.

Lee completamente, en este orden:
1. sistema_escolar_api/docs/funcionalidades/ANIO_LECTIVO.md (el principal)
2. frontend-react/docs/funcionalidades/ANIO_LECTIVO.md
3. El CLAUDE.md de cada repo que vayas a tocar.
4. sistema_escolar_api/docs/MIGRACIONES.md si la fase toca migraciones.

Esto NO es una capa del programa de modularización de docs/modularizacion/
ni un módulo de la migración arquitectónica del frontend. Es una función
nueva de producto, documentada aparte a propósito. No la mezcles con esos
índices.

Antes de escribir una sola línea de código:
1. Confirma en cada repo que estás en main y que git status está limpio.
2. Confirma, leyendo "Entrega para el siguiente chat" de cada documento,
   cuál fue la última fase terminada. Si dice "diseño y documentación", no
   hay código de esta funcionalidad todavía: no asumas lo contrario.
3. Revisa "Preguntas abiertas" y "Hallazgos fuera de alcance". Si alguna
   pregunta que afecta a la fase siguiente sigue sin respuesta, pregúntale
   al usuario. No la infieras ni elijas por tu cuenta.
4. Confirma que el usuario autoriza explícitamente la fase exacta que vas a
   empezar. Un "continúa" genérico no basta si la fase no se ha iniciado.

Reglas de esta funcionalidad:
- El orden de fases es obligatorio (0, 1, 2, 3, 4, 5, 6, 7). En particular:
  la fase 3 (lecturas por año) debe estar en producción antes de crear el
  primer curso de 2027, y la fase 2 (cobros por año) antes del primer pago
  de matrícula 2027 y en todo caso antes del 1 de enero de 2027.
- Todo lo existente es del año 2026. Si los números de la fase 0 muestran
  otra cosa, detente y avisa.
- estudiantes.curso_id es la copia del curso del año activo. Solo la
  escribe sincronizar_curso_vigente. La consulta de control del documento
  debe dar 0 filas.
- Con el año activo, cada respuesta del backend y cada petición del
  frontend deben quedar idénticas a las de hoy. Pruébalo con
  caracterización antes de cambiar.
- Pagos, cartera y migraciones son zona sensible: cambio mínimo, pruebas
  primero y explicación al usuario antes de tocar.
- El frontend no decide qué año es editable ni qué se cobra.
- No agregues funciones que no estén en los documentos. No rediseñes
  pantallas no mencionadas. No borres columnas legado sin permiso.

Al terminar un paso:
- corre las pruebas específicas y la verificación global del repo
  (python scripts/verify.py en el backend; pnpm run check:deploy en el
  frontend) y git diff --check;
- actualiza el ANIO_LECTIVO.md correspondiente: qué se hizo, cómo se
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
