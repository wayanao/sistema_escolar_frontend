// Contratos y transformaciones puras del panel de administración.
// Los estilos animados de las tarjetas siguen en la página: son presentación y
// se mueven en la capa 5.

export const ROL_ADMIN = "admin";

export const RUTA_CARTERA_VENCIDA = "/admin/cartera-vencida";

export const MENSAJE_ERROR_CARTERA = "No se pudo cargar la cartera vencida.";

export const ACCESOS_ADMIN = [
    {
        title: "Gestión de Pagos",
        description: "Administrar pagos y finanzas del sistema",
        icon: "💰",
        path: "/admin/pagos",
        surface: "#ecfdf5",
        hover: "#dcfce7",
        border: "#bbf7d0",
        accent: "#16a34a",
        accentSoft: "rgba(22, 163, 74, 0.13)",
    },
    {
        title: "Gestión de Estudiantes",
        description: "Administrar estudiantes y matrículas",
        icon: "👨‍🎓",
        path: "/admin/estudiantes",
        surface: "#eff6ff",
        hover: "#dbeafe",
        border: "#bfdbfe",
        accent: "#2563eb",
        accentSoft: "rgba(37, 99, 235, 0.13)",
    },
    {
        title: "Gestión Académica",
        description: "Administrar profesores, cursos, asignaciones y horarios.",
        icon: "🎓",
        path: "/admin",
        surface: "#fff7ed",
        hover: "#ffedd5",
        border: "#fed7aa",
        accent: "#ea580c",
        accentSoft: "rgba(234, 88, 12, 0.14)",
    },
    {
        title: "Reportes",
        description: "Ver reportes y estadísticas del sistema",
        icon: "📊",
        path: "/admin/reportes",
        // Los morados de la paleta (src/index.css): los del menú lateral.
        surface: "rgb(var(--purple-50))",
        hover: "rgb(var(--purple-100))",
        border: "rgb(var(--purple-200))",
        accent: "rgb(var(--purple-600))",
        accentSoft: "rgb(var(--purple-600) / 0.14)",
    },
];

export const formatearMoneda = (valor) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(Number(valor || 0));

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
