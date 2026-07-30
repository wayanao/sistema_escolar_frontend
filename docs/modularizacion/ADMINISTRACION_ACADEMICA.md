# Modularización: Administración académica y horarios

## Control

- Estado: Pendiente.
- Orden: 13.
- Riesgo inicial: Alto.
- Flujo Git: `main` directo.
- Commit base: Por registrar al iniciar.
- Commit final: Pendiente.
- Última actualización: 2026-07-30.

## Objetivo

Separar gestión de profesores, cursos, materias, asignaciones y horarios sin
modificar relaciones académicas ni estados operativos.

## Inventario inicial

- `src/pages/Admin.jsx`
- `src/pages/GestionAcademica.jsx`
- `src/pages/HorariosAdmin.jsx`
- `src/components/CrearProfesor.jsx`
- `src/components/CrearCurso.jsx`
- `src/components/CrearMateria.jsx`
- `src/components/AsignarClase.jsx`
- `src/components/HorariosPorCurso.jsx`
- `src/components/HorariosProfesores.jsx`

## Invariantes

- Creación y actualización de entidades académicas.
- Estados activo, inactivo y todos.
- Prevención y mensajes de duplicados.
- Asignaciones válidas entre profesor, materia y curso.
- Horarios separados por jornada.
- Navegación y pestañas administrativas actuales.

## Riesgos iniciales

- El módulo contiene varias entidades relacionadas.
- Alterar identificadores o asociaciones existentes.
- Duplicar formularios y consultas entre pestañas.
- Cambiar reglas de estado operativo.

## Estrategia adicional

La capa 0 debe dividir contratos por entidad. Un servicio puede exponer
secciones claras, pero no debe convertirse en un archivo monolítico sin límites.

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

Crear un mapa de entidades, endpoints y dependencias; elegir una entidad piloto
sin modificar simultáneamente las demás.

## Entrega para el siguiente chat

- Última capa terminada: Ninguna.
- Verificación más reciente: No ejecutada para el módulo.
- Siguiente acción exacta: Ejecutar capa 0.
