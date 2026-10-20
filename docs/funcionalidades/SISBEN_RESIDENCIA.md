# Funcionalidad: SISBÉN y lugar de residencia — Frontend

## Control

- Estado: **Diseño (S0) en el commit `6c90e51`. En este repo, nada
  implementado.** El backend escribió su paso S1 el 2026-10-19 (sin commit,
  migración sin aplicar). Confirmado con el usuario: nivel del SISBÉN 1, 2 o
  3, y sin departamento.
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

## Fuera de alcance

- Factura, certificados y otros impresos: sin cambios.
- Ver estos datos en otra pantalla que no sea el formulario.
- El registro del aspirante en Admisiones.

## Entrega para el siguiente chat

- Hecho: S0, el diseño, el 2026-10-19. No hay código de esta funcionalidad
  en este repo. El backend tiene su S1 escrito, sin commit.
- Siguiente acción exacta: ver la entrega del documento principal (S2, que
  hace el usuario). El S3 de este repo va después, con su autorización.
- Prompt para retomar: `docs/funcionalidades/PROMPT_CONTINUACION_SISBEN_RESIDENCIA.md`.
