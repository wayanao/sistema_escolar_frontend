# Modularización: Boletines

## Control

- Estado: Pendiente.
- Orden: 4.
- Riesgo inicial: Alto.
- Flujo Git: `main` directo.
- Commit base: Por registrar al iniciar.
- Commit final: Pendiente.
- Última actualización: 2026-07-30.

## Objetivo

Separar generación, ingreso docente, orden de materias y presentación de
boletines sin cambiar cálculos, textos guardados ni formato imprimible.

## Inventario inicial

- `src/components/boletin/Boletin.jsx`
- `src/components/boletin/Header.jsx`
- `src/components/boletin/IngresoBoletinProfesor.jsx`
- `src/components/boletin/Materia.jsx`
- `src/components/boletin/TablaNotas.jsx`
- `src/components/OrdenBoletin.jsx`
- `src/pages/Formulario.jsx`
- `src/constants/valoracionesDesarrollo.js`
- Dependencias de impresión por delimitar en la capa 0.

## Invariantes

- Formato A4 y desplazamiento móvil del boletín.
- Orden configurable de materias por curso.
- Ingreso de observaciones y logros por estudiante.
- `Aplicar logros a todos` y `Guardar todo`.
- Ocultamiento de campos técnicos como `mas_alto`.
- Etiquetas humanas protegidas de traducción automática.

## Riesgos iniciales

- Alterar el orden o los cálculos académicos del boletín.
- Mezclar generación administrativa e ingreso docente.
- Romper impresión o estilos compartidos.
- Sobrescribir observaciones individuales en acciones masivas.

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

Separar en el inventario los subflujos de generación, ingreso docente, orden e
impresión; proteger las acciones masivas antes de extraer contratos.

## Entrega para el siguiente chat

- Última capa terminada: Ninguna.
- Verificación más reciente: No ejecutada para el módulo.
- Siguiente acción exacta: Ejecutar capa 0.
