# Funcionalidad: SISBÉN y lugar de residencia — Frontend

## Control

- Estado: **S3 escrito y verificado el 2026-10-20, sin commit.** El backend
  (S1 y S2) y la migración ya están en producción desde el mismo día.
  Confirmado con el usuario: nivel del SISBÉN 1, 2 o 3, y sin departamento.
- Tipo: Función nueva de producto. No es un módulo del plan de
  `docs/modularizacion/README.md` y no debe confundirse con uno.
- **El documento principal es
  `sistema_escolar_api/docs/funcionalidades/SISBEN_RESIDENCIA.md`**: ahí
  están las decisiones, las columnas, el contrato de la API y el orden de
  publicación. Este documento cubre solo la pantalla.
- Depende de: el backend con la migración aplicada en producción (pasos S1 y
  S2) antes de publicar el S3.
- Última actualización: 2026-10-19.

## Dónde se ve

En `components/estudiantesObservador/admin/FormularioEstudianteAdmin.jsx`,
que es la misma ficha en tres lugares: crear estudiante, editar estudiante y
matricular desde una admisión (paso E5 de la entrevista de admisión). Con
cambiarla ahí, los tres quedan cubiertos.

## Cambios en el formulario (paso S3)

1. **"Lugar de residencia"**, una sección nueva en el lugar de la caja
   "Dirección":
   - Dirección (calle o carrera y número), con un ejemplo en gris. Es el
     mismo campo `direccion` de siempre.
   - Barrio o vereda.
   - Municipio.
   - Zona: urbana o rural (lista).
   - Punto de referencia (opcional), por ejemplo "frente a la tienda X".
2. **SISBÉN**, en "Datos adicionales", junto a Estrato y EPS:
   - ¿Tiene SISBÉN?: sin dato, sí o no.
   - Si es "sí": Grupo (A, B, C o D), Subgrupo (lista que depende del grupo)
     y Nivel del SISBÉN anterior (opcional).
   - Al elegir "no" o "sin dato" se vacían grupo, subgrupo y nivel. Al cambiar
     de grupo se vacía el subgrupo si ya no corresponde.

## Arquitectura (según las capas del proyecto)

- `src/constants/sisben.js`: grupos, subgrupos por grupo, niveles y zonas.
  En `constants/` como `documentosEstudiante.js`, porque la ficha también la
  usa Admisiones.
- `utils/estudiantesObservador/estudiantes.js`: los ocho campos en
  `ESTUDIANTE_INICIAL`; "sí"/"no"/"sin dato" ↔ `true`/`false`/`null` al
  armar el cuerpo y al cargar para editar; vaciar lo que depende del SISBÉN.
  Pruebas en su `*.test.js`.
- El formulario solo presenta. El backend vuelve a validar todo.
- El cuerpo nuevo **siempre lleva los ocho campos**, para que el backend los
  reemplace juntos (decisión 4 del documento principal).

## Contrato del backend (su paso S1)

- Campos en `POST /estudiantes`, `PUT /estudiantes/{id}` y `POST
  /admisiones/{id}/matricular`: `sisben` (`true`, `false` o `null`),
  `sisben_grupo` (`A` a `D`), `sisben_subgrupo` (del grupo: `A1`–`A5`,
  `B1`–`B7`, `C1`–`C18`, `D1`–`D21`), `sisben_nivel` (número `1`, `2` o `3`),
  `barrio` (150), `municipio` (100), `zona_residencia` (`urbana` o `rural`) y
  `punto_referencia` (255).
- `422` con el motivo en español si llega grupo, subgrupo o nivel sin `sisben:
  true`, o un subgrupo que no es de su grupo.
- `GET /estudiantes/{id}` los devuelve (con `null` si no hay dato), así que
  `normalizarEstudianteParaEdicion` los recibe sin cambios en el servicio.
- Detalle en `sistema_escolar_api/docs/API_ENDPOINTS.md`, "Estudiantes".

## Avance del paso S3, 2026-10-20

Autorizado por el usuario ("continúa", en respuesta a si se empezaba el S3).
Al empezar, los dos repos estaban en `main` y limpios; el backend, `ahead 1`
con un registro de documentos.

**Pruebas primero** (fallaron antes del código):

- `utils/estudiantesObservador/estudiantes.test.js` (16): el estado inicial
  con los ocho vacíos y el cuerpo con los ocho en `null`; los subgrupos (A1 a
  A5, B1 a B7, C1 a C18, D1 a D21); "si"/"no"/"" ↔ `true`/`false`/`null`; el
  nivel como número; un cuerpo sin esos campos no los inventa; lo que trae el
  backend vuelve al formulario y regresa igual; y qué se vacía al cambiar el
  SISBÉN o el grupo.
- `FormularioEstudianteAdmin.test.jsx` (7): la sección "Lugar de residencia"
  con sus cinco campos, largos y opciones; lo ya guardado se muestra; sin
  SISBÉN no se pide la clasificación; el subgrupo ofrece solo los de su grupo
  y espera al grupo; y al marcar "no" o cambiar de grupo se vacía lo que
  corresponde.
- `useFormularioEstudianteAdmin.test.js` (2): al editar, lo guardado va y
  vuelve igual; al crear, el cuerpo lleva los ocho.

**Código:**

- `src/constants/sisben.js` (nuevo): sin dato/sí/no, grupos con lo que
  significan (A: pobreza extrema, B: pobreza moderada, C: vulnerable, D: no
  pobre ni vulnerable), subgrupos por grupo, niveles 1 a 3 y zonas.
- `utils/estudiantesObservador/estudiantes.js`: los ocho en el estado
  inicial; la conversión al enviar (`limpiarPayloadEstudiante`) y al cargar
  (`normalizarEstudianteParaEdicion`); `actualizarCampoEstudiante`.
- `FormularioEstudianteAdmin.jsx`: la sección "Lugar de residencia" en lugar
  de la caja "Dirección" (que sigue siendo un área de texto, para no quitarle
  los saltos de línea a lo ya escrito) y el bloque del SISBÉN después de
  Estrato. Cada campo nuevo tiene su etiqueta enlazada (`htmlFor`), y
  `Campo` acepta ese dato opcional.
- Ajustada a propósito: `AdmisionesAdmin.test.jsx` buscaba la caja por la
  etiqueta vieja "Dirección"; ahora usa la nueva. Lo que comprueba no cambió.

**Verificación:** `pnpm run check:deploy` → **2652 pruebas en 369 archivos**,
lint y build correctos; `git diff --check` limpio. Sin probar todavía en la
app con el navegador.

## Fuera de alcance

- Factura, certificados y otros impresos: sin cambios.
- Ver estos datos en otra pantalla que no sea el formulario.
- El registro del aspirante en Admisiones.

## Entrega para el siguiente chat

- Hecho: S0 (diseño) y S3 (el formulario), este último sin commit. Ver
  "Avance del paso S3". El backend está completo y en producción.
- Siguiente acción exacta: que el usuario lo pruebe en local con el Colegio
  Demo (nunca con estudiantes de `tenant_2005`, porque el backend local
  escribe en la base real): crear un estudiante con SISBÉN y residencia,
  editarlo, marcar "no" y ver que se vacía la clasificación, y matricular a
  un aspirante desde Admisiones. Después, commit y push de este repo.
- Prompt para retomar: `docs/funcionalidades/PROMPT_CONTINUACION_SISBEN_RESIDENCIA.md`.
