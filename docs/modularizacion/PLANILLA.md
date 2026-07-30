# Modularización: Planilla

## Control

- Estado: Pendiente.
- Orden: 2.
- Riesgo inicial: Alto.
- Flujo Git: `main` directo.
- Commit base: Por registrar al iniciar.
- Commit final: Pendiente.
- Última actualización: 2026-07-30.

## Objetivo

Separar carga académica, tipos de evaluación, notas, promedios y presentación
responsive sin modificar cálculos ni reglas del backend.

## Inventario inicial

- `src/pages/Planilla.jsx`
- `src/components/PlanillaRow.jsx`
- `src/components/EncabezadoContextoCurso.jsx`
- `src/constants/valoracionesDesarrollo.js`
- `src/utils/periodoProfesor.js`
- Llamadas directas a `src/utils/api.js` por inventariar en la capa 0.

## Invariantes

- Selección recordada de clase, periodo y tipo de evaluación.
- Vista de tarjetas en móvil y tabla en escritorio.
- Creación, edición y eliminación de tipos de evaluación.
- Cálculo y restauración de notas y promedios.
- Manejo de valoraciones de desarrollo.
- Protección de etiquetas ante traducción automática.

## Riesgos iniciales

- Alterar cálculos, redondeos o notas fuera de rango.
- Desalinear estudiantes y columnas de evaluación.
- Perder estados de carga o bloquear guardados válidos.
- Confundir reglas numéricas con valoraciones cualitativas.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Pendiente |
| 1. Utilidades puras | Pendiente |
| 2. Servicio HTTP | Pendiente |
| 3. Hooks de consulta | Pendiente |
| 4. Hooks de comandos | Pendiente |
| 5. Presentación | Pendiente |
| 6. Composición | Pendiente |
| 7. Cierre | Pendiente |

## Primera acción

Proteger con pruebas los cálculos, mapeos de estudiantes, tipos de evaluación
y guardado antes de cambiar imports o estado.

## Entrega para el siguiente chat

- Última capa terminada: Ninguna.
- Verificación más reciente: No ejecutada para el módulo.
- Siguiente acción exacta: Ejecutar capa 0.
