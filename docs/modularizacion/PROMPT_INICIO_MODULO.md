# Prompt para iniciar la modularización de un módulo

Reemplazar:

- `<MODULO>` por el nombre visible, por ejemplo `Asistencia`.
- `<ARCHIVO_MODULO>` por el archivo correspondiente, por ejemplo
  `ASISTENCIA.md`.

Copiar el siguiente texto en un chat nuevo:

```text
Vamos a modularizar el módulo <MODULO> del frontend.

Lee completamente:
- docs/modularizacion/README.md
- docs/modularizacion/<ARCHIVO_MODULO>

Después inspecciona únicamente los archivos fuente relacionados con este
módulo y las instrucciones locales del repositorio.

Antes de modificar:
1. Confirma que estamos en main.
2. Confirma que git status está limpio.
3. Comprueba que el commit base coincide con el documento del módulo.
4. Si hay cambios anteriores o el commit base no coincide, informa el problema
   y no mezcles ni sobrescribas esos cambios.

Trabaja exclusivamente en <MODULO>.
Implementa únicamente la primera capa pendiente indicada en el documento.
No inicies otra capa en este mismo turno. Cuando termines la capa actual,
verifícala, documenta el avance y detente hasta que yo te ordene continuar.

Esta tarea es una migración arquitectónica:
- conserva diseño, textos, rutas y comportamiento;
- conserva contratos y payloads del backend;
- no agregues funciones nuevas;
- no hagas rediseños;
- no corrijas asuntos ajenos;
- no modifiques otros módulos;
- no crees abstracciones compartidas sin uso real en dos o más dominios.

Aplica las responsabilidades definidas en el plan:
- utils para contratos y transformaciones puras;
- services para transporte HTTP;
- hooks para estado, efectos, consultas y comandos;
- components para presentación;
- pages como raíces de composición;
- pruebas junto a las unidades que protegen.

Antes de cada extracción importante, agrega o conserva pruebas que protejan el
comportamiento actual. Al terminar la capa:
- ejecuta las pruebas específicas;
- actualiza docs/modularizacion/<ARCHIVO_MODULO>;
- registra decisiones, riesgos y la siguiente acción exacta.
- informa cuál es la siguiente capa, pero no la inicies.

Solamente cuando la capa actual sea la última del módulo:
1. Actualiza la documentación específica y global correspondiente.
2. Ejecuta pnpm run check:deploy.
3. Ejecuta git diff --check.
4. Revisa que el diff pertenezca únicamente a <MODULO> y su documentación.
5. Confirma que no quedan implementaciones antiguas duplicadas.

No hagas commit, push ni deploy.
Déjame:
- la capa actual completa y verificada;
- el documento del módulo actualizado;
- el resumen de los archivos modificados;
- el resultado de sus pruebas;
- la siguiente capa pendiente y su objetivo.

Cuando se complete la última capa, déjame además:
- el resultado final de pruebas, lint y build;
- los pasos de verificación manual en producción;
- un mensaje sugerido para el único commit del módulo.

Yo haré el commit, el push a origin/main y revisaré el deploy de producción.
```

## Ejemplo para Asistencia

```text
Vamos a modularizar el módulo Asistencia del frontend.

Lee completamente:
- docs/modularizacion/README.md
- docs/modularizacion/ASISTENCIA.md

Sigue el flujo directo sobre main documentado allí.
Trabaja únicamente en la primera capa pendiente de Asistencia.
No cambies diseño, rutas, comportamiento ni contratos del backend.
No modifiques otros módulos y no hagas commit, push ni deploy.

Completa solo esa capa, actualiza ASISTENCIA.md, ejecuta sus pruebas específicas
y detente. Indica cuál es la siguiente capa, pero no la inicies hasta que yo lo
ordene explícitamente.

Cuando termines la última capa, ejecuta también pnpm run check:deploy y
git diff --check, y déjame el módulo listo para que yo cree un único commit y
lo publique en producción.
```
