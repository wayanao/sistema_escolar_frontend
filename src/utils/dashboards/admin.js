// Contratos y transformaciones puras del panel de administración.
import { capitalizarNombreVisible, primeraMayuscula } from "../nombres";

export const ROL_ADMIN = "admin";

export const RUTA_CARTERA_VENCIDA = "/admin/cartera-vencida";

// «Cobrar» abre Gestión de Pagos con el estudiante ya elegido, igual que desde
// Cartera vencida (`state.estudiante_id`).
export const RUTA_PAGOS = "/admin/pagos";

export const MENSAJE_ERROR_CARTERA = "No se pudo cargar la cartera vencida.";

// Lo que se ve en lugar de un monto con «Ocultar valores».
export const VALOR_OCULTO = "$ •••••••";

// Cuántos cursos muestra «Deuda por curso».
export const CURSOS_EN_DEUDA_POR_CURSO = 5;

export const ACCESOS_ADMIN = [
    {
        title: "Gestión de Pagos",
        description: "Administrar pagos y finanzas del sistema",
        icono: "pagos",
        path: "/admin/pagos",
        accent: "#15803d",
        accentSoft: "#dcfce7",
    },
    {
        title: "Gestión de Estudiantes",
        description: "Administrar estudiantes y matrículas",
        icono: "estudiantes",
        path: "/admin/estudiantes",
        accent: "#1d4ed8",
        accentSoft: "#dbeafe",
    },
    {
        title: "Gestión Académica",
        description: "Administrar profesores, cursos, asignaciones y horarios.",
        icono: "academica",
        path: "/admin",
        accent: "#c2410c",
        accentSoft: "#ffedd5",
    },
    {
        title: "Reportes",
        description: "Ver reportes y estadísticas del sistema",
        icono: "reportes",
        path: "/admin/reportes",
        // Los morados de la paleta (src/index.css): los del menú lateral.
        accent: "rgb(var(--purple-600))",
        accentSoft: "rgb(var(--purple-100))",
    },
];

export const formatearMoneda = (valor) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(Number(valor || 0));

export const montoVisible = (valor, oculto) => (oculto ? VALOR_OCULTO : formatearMoneda(valor));

// El panel de administración conserva el resto del nombre tal como llega; el
// panel del profesor sí lo baja a minúsculas. Son dos reglas distintas.
export const capitalizarInicial = (valor) => {
    const texto = String(valor || "").trim();
    return texto ? texto.charAt(0).toLocaleUpperCase("es-CO") + texto.slice(1) : "";
};

export const esAdmin = (usuario) => Boolean(usuario && usuario.rol === ROL_ADMIN);

export const primerNombreAdmin = (nombre) =>
    capitalizarInicial((nombre || "Admin").trim().split(/\s+/)[0]);

export const hayMoraEnCartera = (resumen) => Boolean(resumen && resumen.total_estudiantes > 0);

export const textoResumenMora = (resumen) =>
    `${resumen.total_estudiantes} estudiantes en mora · Mora: ${formatearMoneda(resumen.total_mora)}`;

export const esTeclaDeActivacion = (tecla) => tecla === "Enter" || tecla === " ";

const numero = (valor) => {
    const convertido = Number(valor);
    return Number.isFinite(convertido) ? convertido : 0;
};

export const textoEstudiantes = (cantidad) =>
    `${cantidad} ${cantidad === 1 ? "estudiante" : "estudiantes"}`;

// «Por cobrar este año», a partir de `/cartera/mora/resumen`. En el backend la
// deuda de cada concepto ya trae su mora (deuda = valor + mora − pagado), así
// que la mora se resta de lo académico para no contarla dos veces: las tres
// partes suman `total_deuda`. La deuda de años anteriores va aparte porque el
// backend no la suma al total del año.
export const composicionDeuda = (resumen) => {
    const mora = Math.max(0, numero(resumen?.total_mora));
    return {
        total: Math.max(0, numero(resumen?.total_deuda)),
        academico: Math.max(0, numero(resumen?.total_academico) - mora),
        ventas: Math.max(0, numero(resumen?.total_inventario)),
        mora,
        aniosAnteriores: Math.max(0, numero(resumen?.total_anios_anteriores)),
        estudiantes: Math.max(0, numero(resumen?.total_estudiantes)),
    };
};

export const inicialesDe = (nombre, apellido) =>
    [nombre, apellido]
        .map((parte) => String(parte || "").trim().charAt(0))
        .join("")
        .toLocaleUpperCase("es-CO") || "?";

// Una línea corta de por qué debe: las cuotas vencidas (o el concepto, si no
// es mensual), las ventas sin pagar y si además debe de años anteriores.
export const detalleDeudor = (item) => {
    const partes = [];
    const cuotas = numero(item?.cuotas_vencidas);
    const conceptos = Array.isArray(item?.conceptos) ? item.conceptos : [];
    if (cuotas > 0) {
        partes.push(cuotas === 1 ? "1 cuota vencida" : `${cuotas} cuotas vencidas`);
    } else if (conceptos.length) {
        const primero = primeraMayuscula(conceptos[0]?.concepto);
        if (primero) {
            partes.push(conceptos.length > 1 ? `${primero} y ${conceptos.length - 1} más` : primero);
        }
    }
    const ventas = Array.isArray(item?.ventas_pendientes) ? item.ventas_pendientes.length : 0;
    if (ventas > 0) {
        partes.push(ventas === 1 ? "1 venta sin pagar" : `${ventas} ventas sin pagar`);
    }
    if (Array.isArray(item?.deuda_anios_anteriores) && item.deuda_anios_anteriores.length) {
        partes.push("también de años anteriores");
    }
    return partes.join(" · ");
};

// Largo de la barrita frente al mayor; nunca menos de 4 % para que se vea.
const porcentajeDe = (valor, mayor) =>
    mayor > 0 ? Math.max(4, Math.round((valor / mayor) * 100)) : 0;

// Los 5 que más deben este año. El backend ya los manda ordenados (`top_5`, por
// `total` de mayor a menor). Quien solo debe de años anteriores (total 0) no
// entra: esa deuda se ve en Cartera vencida.
export const mayoresDeudores = (resumen) => {
    const lista = (Array.isArray(resumen?.top_5) ? resumen.top_5 : [])
        .filter((item) => numero(item?.total) > 0)
        .slice(0, 5);
    const mayor = Math.max(0, ...lista.map((item) => numero(item.total)));
    return lista.map((item, indice) => ({
        estudianteId: item.estudiante_id,
        puesto: indice + 1,
        nombre: capitalizarNombreVisible(`${item.nombre || ""} ${item.apellido || ""}`) || "Estudiante",
        iniciales: inicialesDe(item.nombre, item.apellido),
        curso: item.curso_nombre || "Sin curso",
        detalle: detalleDeudor(item),
        total: numero(item.total),
        porcentaje: porcentajeDe(numero(item.total), mayor),
    }));
};

// Los cursos que más deben. `distribucion_cursos` ya llega de mayor a menor.
export const deudaPorCurso = (resumen, limite = CURSOS_EN_DEUDA_POR_CURSO) => {
    const lista = (Array.isArray(resumen?.distribucion_cursos) ? resumen.distribucion_cursos : [])
        .filter((curso) => numero(curso?.total) > 0)
        .slice(0, limite);
    const mayor = Math.max(0, ...lista.map((curso) => numero(curso.total)));
    return lista.map((curso) => ({
        cursoId: curso.curso_id,
        nombre: curso.curso_nombre || "Sin curso",
        estudiantes: numero(curso.estudiantes),
        total: numero(curso.total),
        porcentaje: porcentajeDe(numero(curso.total), mayor),
    }));
};
