# Modularización: Cartera y tipos de pago

## Control

- Estado: Pendiente.
- Orden: 8.
- Riesgo inicial: Muy alto.
- Flujo Git: `main` directo.
- Commit base: Por registrar al iniciar.
- Commit final: Pendiente.
- Última actualización: 2026-07-30.

## Objetivo

Separar cartera vencida, estados de cuenta y administración de conceptos de
pago sin modificar generación de deuda, saldos ni asignaciones por curso.

## Inventario inicial

- `src/pages/CarteraVencidaAdmin.jsx`
- `src/pages/TiposPagosAdmin.jsx`
- `src/components/cartera/AdministrarTiposPago.jsx`
- Dependencia con `src/pages/PagosAdmin.jsx`, fuera del alcance de este módulo.
- Endpoints y contratos por inventariar en la capa 0.

## Invariantes

- Estados de cuenta por estudiante y curso.
- Impresión A4 y desplazamiento móvil.
- Conceptos activos, inactivos y borradores.
- Asignación de conceptos a cursos.
- Previsualización de cartera y razones de configuración incompleta.
- Deudas existentes visibles aunque cambie una configuración.

## Riesgos iniciales

- Alterar generación o visibilidad de obligaciones financieras.
- Confundir configuración de conceptos con pagos registrados.
- Romper asociaciones por curso.
- Duplicar conceptos o esconder deudas ya generadas.

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

Separar en el inventario cartera consultable, impresión y configuración de
conceptos; documentar dependencias con Pagos sin modificarlas.

## Entrega para el siguiente chat

- Última capa terminada: Ninguna.
- Verificación más reciente: No ejecutada para el módulo.
- Siguiente acción exacta: Ejecutar capa 0.
