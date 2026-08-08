// Contratos y transformaciones de la sección de cumpleaños, compartida por el
// panel de administración y el del profesor. Cada panel conserva su propio
// texto de estado vacío en la página, porque es presentación.

export const DIAS_RANGO_CUMPLEANOS = 7;

export const MENSAJE_ERROR_CUMPLEANOS = "No se pudieron cargar los cumpleaños de la semana.";

const MILISEGUNDOS_DIA = 24 * 60 * 60 * 1000;

// Peso de ordenamiento para quien no tiene una fecha de nacimiento utilizable.
const DIAS_SIN_FECHA = 999;

export const construirParametrosCumpleanos = (dias) => ({ dias });

export const normalizarCumpleanos = (data) => (Array.isArray(data) ? data : []);

export const nombreCompletoEstudiante = (estudiante) =>
    `${estudiante?.nombre || ""} ${estudiante?.apellido || ""}`.trim() || "Estudiante";

export const obtenerInfoCumpleanos = (fechaNacimiento, ahora) => {
    if (!fechaNacimiento) return null;
    const match = String(fechaNacimiento).match(/^(\d{4})-\d{2}-\d{2}/);
    if (!match) return null;

    const [anio, mes, dia] = String(fechaNacimiento)
        .slice(0, 10)
        .split("-")
        .map(Number);

    if (!anio || !mes || !dia) return null;

    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    let fechaCumple = new Date(hoy.getFullYear(), mes - 1, dia);

    if (fechaCumple < hoy) {
        fechaCumple = new Date(hoy.getFullYear() + 1, mes - 1, dia);
    }

    const dias = Math.round((fechaCumple - hoy) / MILISEGUNDOS_DIA);
    const edad = fechaCumple.getFullYear() - anio;
    const etiqueta = dias === 0 ? "Hoy" : dias === 1 ? "Mañana" : `En ${dias} días`;

    return {
        dias,
        edad: edad > 0 ? edad : null,
        etiqueta,
    };
};

export const ordenarCumpleanos = (estudiantes, ahora) =>
    [...estudiantes].sort((a, b) => {
        const diasA = obtenerInfoCumpleanos(a.fecha_nacimiento, ahora)?.dias ?? DIAS_SIN_FECHA;
        const diasB = obtenerInfoCumpleanos(b.fecha_nacimiento, ahora)?.dias ?? DIAS_SIN_FECHA;
        return (
            diasA - diasB ||
            nombreCompletoEstudiante(a).localeCompare(nombreCompletoEstudiante(b))
        );
    });
