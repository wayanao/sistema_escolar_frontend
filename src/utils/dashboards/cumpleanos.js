// Contratos y transformaciones de la sección de cumpleaños, compartida por el
// panel de administración y el del profesor. Cada panel conserva su propio
// texto de estado vacío en la página, porque es presentación.
import { capitalizarNombreVisible } from "../nombres";

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

// --- Muro de cumpleaños (2026-11-11) -----------------------------------------

// Cuántos globos de hoy se sueltan a pasear; si hay más, los demás se quedan en
// el muro para no llenar la pantalla.
export const MAX_GLOBOS_SUELTOS = 3;

// Colores de fiesta. La ficha todavía no guarda si el estudiante es niña o
// niño, así que no se usa el rosado ni el azul: ningún color sugiere eso.
// `tinta` es el color de los datos pequeños: blanco solo donde se lee bien.
export const PALETAS_GLOBO = [
    { claro: "#fef3c7", base: "#f59e0b", oscuro: "#92400e", tinta: "#451a03" },
    { claro: "#ffedd5", base: "#fb923c", oscuro: "#9a3412", tinta: "#431407" },
    { claro: "#a5f3fc", base: "#0e7490", oscuro: "#164e63", tinta: "#ffffff" },
    { claro: "#d9f99d", base: "#4d7c0f", oscuro: "#365314", tinta: "#ffffff" },
];

const formatoDiaSemana = new Intl.DateTimeFormat("es-CO", { weekday: "long" });

// «Hoy», «Mañana» o el día con su número: «Viernes 13».
export const etiquetaDiaGlobo = (info, ahora) => {
    if (!info) return "";
    if (info.dias === 0) return "Hoy";
    if (info.dias === 1) return "Mañana";
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + info.dias);
    const dia = formatoDiaSemana.format(fecha);
    return `${dia.charAt(0).toLocaleUpperCase("es-CO")}${dia.slice(1)} ${fecha.getDate()}`;
};

// Un globo por estudiante, en el orden del muro: primero los de hoy. Quien no
// tiene una fecha de nacimiento utilizable no sale.
export const globosDeCumpleanos = (estudiantes, ahora) =>
    ordenarCumpleanos(normalizarCumpleanos(estudiantes), ahora)
        .map((estudiante) => ({ estudiante, info: obtenerInfoCumpleanos(estudiante.fecha_nacimiento, ahora) }))
        .filter(({ info }) => info)
        .map(({ estudiante, info }, indice) => ({
            id: estudiante.estudiante_id ?? estudiante.id ?? `globo-${indice}`,
            nombre: capitalizarNombreVisible(nombreCompletoEstudiante(estudiante)),
            curso: estudiante.curso || "",
            edad: info.edad,
            esHoy: info.dias === 0,
            etiqueta: etiquetaDiaGlobo(info, ahora),
            paleta: PALETAS_GLOBO[indice % PALETAS_GLOBO.length],
        }));

// «TERCERO · 9 años»: el curso y los años que cumple, lo que haya. Entre el
// número y «años» va un espacio que no se parte: en el globo, si no cabe,
// baja «9 años» entero a la línea de abajo.
export const textoDatosGlobo = (globo) =>
    [globo?.curso, globo?.edad ? `${globo.edad}\u00a0años` : ""].filter(Boolean).join(" · ");
