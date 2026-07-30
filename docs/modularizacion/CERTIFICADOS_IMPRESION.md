# Modularización: Certificados e impresión

## Control

- Estado: Pendiente.
- Orden: 6.
- Riesgo inicial: Alto.
- Flujo Git: `main` directo.
- Commit base: Por registrar al iniciar.
- Commit final: Pendiente.
- Última actualización: 2026-07-30.

## Objetivo

Separar consultas, configuración institucional y documentos imprimibles sin
alterar contenido académico, branding ni reglas de impresión.

## Inventario inicial

- `src/pages/CertificadosAdmin.jsx`
- `src/pages/BrandingAdmin.jsx`
- `src/components/impresion/DocumentoImprimible.jsx`
- `src/components/admin/IdentidadInstitucional.jsx`
- `src/components/admin/PlantillasAdmin.jsx`
- `src/services/printingService.js`
- `src/hooks/usePrintConfig.js`
- `src/components/ReporteEstudiante.jsx`

## Invariantes

- Certificados de notas y matrícula.
- Reporte académico parcial individual o por curso.
- Selección de periodo y materia.
- Branding, firmas, encabezados y pie de página.
- Formato A4, scroll móvil y `window.print()`.
- Configuración compartida por los distintos impresos.

## Riesgos iniciales

- Romper dimensiones o estilos de impresión.
- Alterar consolidación académica entre periodos.
- Duplicar carga de branding o configuración.
- Mezclar lógica específica de certificados con infraestructura compartida.

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

Delimitar infraestructura de impresión compartida frente a contratos propios
de certificados y crear pruebas para construcción de reportes.

## Entrega para el siguiente chat

- Última capa terminada: Ninguna.
- Verificación más reciente: No ejecutada para el módulo.
- Siguiente acción exacta: Ejecutar capa 0.
