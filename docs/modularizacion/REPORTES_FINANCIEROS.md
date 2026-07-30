# Modularización: Reportes financieros

## Control

- Estado: Pendiente.
- Orden: 9.
- Riesgo inicial: Alto.
- Flujo Git: `main` directo.
- Commit base: Por registrar al iniciar.
- Commit final: Pendiente.
- Última actualización: 2026-07-30.

## Objetivo

Separar consultas, filtros, consolidaciones y presentación de reportes sin
alterar montos visibles ni interpretación de métodos de pago.

## Inventario inicial

- `src/pages/ReportesAdmin.jsx`
- `src/utils/reportesMediosPago.js`
- Dependencias de pagos, egresos y subsidios por delimitar.
- Endpoints y formatos de respuesta por inventariar en la capa 0.

## Invariantes

- Filtros por fecha y medio de pago.
- Soporte de pagos simples y combinados.
- Montos parciales por método cuando existen.
- Referencias de transferencia, tarjeta y subsidio.
- Totales de ingresos y egresos.
- Compatibilidad con variantes históricas de nombres de campos.

## Riesgos iniciales

- Cambiar totales por interpretar incorrectamente un pago mixto.
- Perder compatibilidad con respuestas legacy.
- Duplicar montos al filtrar.
- Mezclar normalización de datos con presentación.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Pendiente |
| 1. Utilidades puras | Pendiente |
| 2. Servicio HTTP | Pendiente |
| 3. Hooks de consulta | Pendiente |
| 4. Hooks de comandos | Pendiente o No aplica por evaluar |
| 5. Presentación | Pendiente |
| 6. Composición | Pendiente |
| 7. Cierre | Pendiente |

## Primera acción

Agregar pruebas exhaustivas a `reportesMediosPago.js` y documentar todas las
variantes reales de respuesta antes de extraer consultas.

## Entrega para el siguiente chat

- Última capa terminada: Ninguna.
- Verificación más reciente: No ejecutada para el módulo.
- Siguiente acción exacta: Ejecutar capa 0.
