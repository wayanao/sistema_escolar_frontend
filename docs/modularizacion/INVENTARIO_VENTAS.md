# Modularización: Inventario y ventas

## Control

- Estado: Pendiente.
- Orden: 10.
- Riesgo inicial: Alto.
- Rama: No creada.
- Commit base y final: Pendientes.
- Última actualización: 2026-07-30.

## Objetivo

Separar catálogo, estado operativo, ventas, cargos y anulaciones sin modificar
existencias, valores ni relaciones con pagos.

## Inventario inicial

- `src/pages/InventarioAdmin.jsx`
- `src/pages/VentasAdmin.jsx`
- `src/components/FacturaModerna.jsx`
- Dependencia con pagos y ventas pendientes por documentar.
- Endpoints por inventariar en la capa 0.

## Invariantes

- Estados activo, inactivo y todos.
- Creación y actualización de productos.
- Registro y anulación de ventas.
- Asociación de ventas pendientes con estudiantes y pagos.
- Montos, cantidades y disponibilidad.
- Presentación de factura cuando corresponda.

## Riesgos iniciales

- Alterar stock o registrar ventas duplicadas.
- Perder trazabilidad de anulaciones.
- Mezclar productos inactivos con disponibilidad operativa.
- Romper integración con pagos.

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

Inventariar por separado catálogo, ventas, anulaciones y facturación; crear
pruebas de payloads y actualización local antes de extraer servicios.

## Entrega para el siguiente chat

- Última capa terminada: Ninguna.
- Verificación más reciente: No ejecutada para el módulo.
- Siguiente acción exacta: Ejecutar capa 0.
