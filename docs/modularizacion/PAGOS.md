# Modularización: Pagos

## Control

- Estado: Pendiente.
- Orden: 7.
- Riesgo inicial: Muy alto.
- Flujo Git: `main` directo.
- Commit base: Por registrar al iniciar.
- Commit final: Pendiente.
- Última actualización: 2026-07-30.

## Objetivo

Separar de forma incremental el registro de pagos, deudas, mensualidades,
adelantos, subsidios y métodos combinados sin cambiar reglas financieras.

## Inventario inicial

- `src/pages/PagosAdmin.jsx`
- `src/components/FacturaModerna.jsx` como dependencia por clasificar.
- Contratos de cartera y ventas pendientes por delimitar.
- Endpoints, payloads y cálculos monetarios por inventariar en la capa 0.

## Invariantes

- Pago normal de deudas académicas e inventario.
- Selección de meses vencidos y abonos parciales.
- Meses adelantados completos o distribuidos.
- Validación de capacidad hasta diciembre.
- Subsidio con referencia libre.
- Métodos combinados cuya suma coincide con el total.
- Confirmaciones y manejo de errores actuales.

## Riesgos iniciales

- Es el archivo más grande y combina varios subflujos financieros.
- Alterar montos, saldos, periodos o asignación de pagos.
- Duplicar envíos o aceptar sumas inconsistentes.
- Acoplamiento con cartera, inventario y reportes.

## Estrategia adicional

La capa 0 debe dividir el módulo en subflujos documentados. Puede requerir más
de un chat y más de un hook de formulario. No se debe extraer todo en una sola
edición.

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

Crear un mapa de subflujos, endpoints y cálculos; proteger primero las
transformaciones monetarias y payloads antes de mover estado React.

## Entrega para el siguiente chat

- Última capa terminada: Ninguna.
- Verificación más reciente: No ejecutada para el módulo.
- Siguiente acción exacta: Ejecutar capa 0.
