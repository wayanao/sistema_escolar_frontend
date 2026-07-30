# Modularización: Nómina, egresos y préstamos

## Control

- Estado: Pendiente.
- Orden: 11.
- Riesgo inicial: Alto.
- Rama: No creada.
- Commit base y final: Pendientes.
- Última actualización: 2026-07-30.

## Objetivo

Separar los flujos financieros laborales relacionados sin fusionar sus reglas
de negocio ni alterar montos, estados o trazabilidad.

## Inventario inicial

- `src/pages/NominaAdmin.jsx`
- `src/pages/EgresosAdmin.jsx`
- `src/pages/PrestamosAdmin.jsx`
- Dependencias con profesores y reportes financieros.
- Endpoints y contratos por inventariar por subflujo en la capa 0.

## Invariantes

- Nómina usa el sueldo del profesor como salario base.
- Egresos conservan filtros por fecha e historial.
- Préstamos no se eliminan y solo permiten acciones vigentes como `Saldar`.
- Estados, confirmaciones y motivos actuales.
- Reportes deben seguir recibiendo los datos esperados.

## Riesgos iniciales

- Son tres subdominios relacionados, pero con contratos diferentes.
- Alterar saldos, fechas o estados financieros.
- Duplicar pagos o perder historial.
- Crear una abstracción compartida demasiado genérica.

## Estrategia adicional

La capa 0 debe evaluar si conviene ejecutar tres secuencias internas dentro de
la misma rama. Las utilidades solo se comparten cuando exista un contrato
idéntico comprobado.

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

Inventariar nómina, egresos y préstamos por separado y documentar únicamente
las dependencias reales entre ellos.

## Entrega para el siguiente chat

- Última capa terminada: Ninguna.
- Verificación más reciente: No ejecutada para el módulo.
- Siguiente acción exacta: Ejecutar capa 0.
