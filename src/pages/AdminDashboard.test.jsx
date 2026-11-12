import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminDashboard from "./AdminDashboard";

const { apiMock, navigateMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn() },
    navigateMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({ default: apiMock }));

vi.mock("react-router-dom", async (importOriginal) => ({
    ...(await importOriginal()),
    useNavigate: () => navigateMock,
    Navigate: ({ to }) => <div data-testid="redirect" data-to={to} />,
}));

// Forma real de `/cartera/mora/resumen`: la deuda académica ya trae la mora
// (1.170.000 = 1.100.000 de cuotas + 70.000 de mora).
const resumenConDeuda = {
    total_estudiantes: 3,
    total_deuda: 1250000,
    total_academico: 1170000,
    total_inventario: 80000,
    total_mora: 70000,
    total_anios_anteriores: 0,
    top_5: [
        {
            estudiante_id: 7,
            nombre: "samuel",
            apellido: "ortiz",
            curso_nombre: "NOVENO",
            total: 800000,
            cuotas_vencidas: 4,
            conceptos: [],
            ventas_pendientes: [],
            deuda_anios_anteriores: [],
        },
        {
            estudiante_id: 9,
            nombre: "valeria",
            apellido: "gómez",
            curso_nombre: "QUINTO",
            total: 450000,
            cuotas_vencidas: 2,
            conceptos: [],
            ventas_pendientes: [{ venta_id: 3, saldo: 80000 }],
            deuda_anios_anteriores: [],
        },
    ],
    distribucion_cursos: [
        { curso_id: 9, curso_nombre: "NOVENO", total: 800000, estudiantes: 1 },
        { curso_id: 5, curso_nombre: "QUINTO", total: 450000, estudiantes: 2 },
    ],
};

const resumenAlDia = {
    total_estudiantes: 0,
    total_deuda: 0,
    total_academico: 0,
    total_inventario: 0,
    total_mora: 0,
    total_anios_anteriores: 0,
    top_5: [],
    distribucion_cursos: [],
};

const cumpleanos = [
    { estudiante_id: 5, nombre: "Ana", apellido: "Arias", curso: "5A", fecha_nacimiento: "2012-08-07" },
];

const ERROR_CARTERA = "No se pudo cargar la cartera vencida.";

const iniciarSesionAdmin = () => {
    localStorage.setItem("usuario", JSON.stringify({ id: 1, nombre: "carlos gómez", rol: "admin" }));
};

const responder = ({ resumen = resumenConDeuda, cumples = cumpleanos } = {}) => {
    apiMock.get.mockImplementation((url) => {
        if (url === "/cartera/mora/resumen") return Promise.resolve({ data: resumen });
        if (url === "/dashboard/cumpleanos/admin") return Promise.resolve({ data: cumples });
        throw new Error(`GET inesperado: ${url}`);
    });
};

const porCobrar = () => screen.getByRole("region", { name: "Por cobrar este año" });

describe("AdminDashboard", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.spyOn(console, "error").mockImplementation(() => {});
        navigateMock.mockClear();
        responder();
    });

    it("redirige a login y no consulta nada cuando no hay usuario", () => {
        render(<AdminDashboard />);

        expect(screen.getByTestId("redirect")).toHaveAttribute("data-to", "/login");
        // El redirect se devuelve; ya no se navega durante el render.
        expect(navigateMock).not.toHaveBeenCalled();
        expect(apiMock.get).not.toHaveBeenCalled();
    });

    it("redirige a login cuando el rol no es admin", () => {
        localStorage.setItem("usuario", JSON.stringify({ id: 2, nombre: "Ana", rol: "profesor" }));

        render(<AdminDashboard />);

        expect(screen.getByTestId("redirect")).toHaveAttribute("data-to", "/login");
        expect(navigateMock).not.toHaveBeenCalled();
        expect(apiMock.get).not.toHaveBeenCalled();
    });

    it("hace las mismas dos consultas de antes, ni una más", async () => {
        iniciarSesionAdmin();

        render(<AdminDashboard />);

        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledWith("/cartera/mora/resumen");
        });
        expect(apiMock.get).toHaveBeenCalledWith("/dashboard/cumpleanos/admin", {
            params: { dias: 7 },
        });
        expect(apiMock.get).toHaveBeenCalledTimes(2);
    });

    it("saluda con el primer nombre capitalizado", () => {
        iniciarSesionAdmin();

        render(<AdminDashboard />);

        expect(screen.getByRole("heading", { level: 1, name: "Hola, Carlos" })).toBeInTheDocument();
        expect(screen.getByText("Panel de administración")).toBeInTheDocument();
    });

    it("muestra lo que se debe este año, entre cuántos y de dónde sale", async () => {
        iniciarSesionAdmin();

        render(<AdminDashboard />);

        await waitFor(() => expect(porCobrar().textContent).toContain("1.250.000"));
        expect(porCobrar().textContent).toContain("entre 3 estudiantes que deben");
        expect(porCobrar().textContent).toContain("1.100.000");
        expect(porCobrar().textContent).toContain("70.000");
    });

    it("muestra los que más deben con su curso y por qué deben", async () => {
        iniciarSesionAdmin();

        render(<AdminDashboard />);

        expect(await screen.findByText("Samuel Ortiz")).toBeInTheDocument();
        expect(screen.getByText("NOVENO · 4 cuotas vencidas")).toBeInTheDocument();
        expect(screen.getByText("QUINTO · 2 cuotas vencidas · 1 venta sin pagar")).toBeInTheDocument();
    });

    it("«Cobrar» abre Gestión de Pagos con ese estudiante", async () => {
        iniciarSesionAdmin();

        render(<AdminDashboard />);

        fireEvent.click(await screen.findByRole("button", { name: "Cobrar a Valeria Gómez" }));

        expect(navigateMock).toHaveBeenCalledWith("/admin/pagos", { state: { estudiante_id: 9 } });
    });

    it("lleva a la cartera vencida completa", async () => {
        iniciarSesionAdmin();

        render(<AdminDashboard />);

        fireEvent.click(screen.getByRole("button", { name: "Ver toda la cartera vencida" }));

        expect(navigateMock).toHaveBeenCalledWith("/admin/cartera-vencida");
    });

    it("muestra la deuda por curso", async () => {
        iniciarSesionAdmin();

        render(<AdminDashboard />);

        const deudaPorCurso = screen.getByRole("region", { name: "Deuda por curso" });
        await waitFor(() => expect(deudaPorCurso.textContent).toContain("NOVENO · 1 estudiante"));
        expect(deudaPorCurso.textContent).toContain("QUINTO · 2 estudiantes");
    });

    it("«Ocultar valores» tapa los montos y «Mostrar valores» los devuelve", async () => {
        iniciarSesionAdmin();

        render(<AdminDashboard />);
        await waitFor(() => expect(porCobrar().textContent).toContain("1.250.000"));

        fireEvent.click(screen.getByRole("button", { name: "Ocultar valores" }));
        expect(screen.queryByText(/1\.250\.000/)).not.toBeInTheDocument();
        expect(screen.queryByText(/800\.000/)).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Mostrar valores" }));
        expect(porCobrar().textContent).toContain("1.250.000");
    });

    it("dice «Cartera al día» cuando nadie debe", async () => {
        iniciarSesionAdmin();
        responder({ resumen: resumenAlDia });

        render(<AdminDashboard />);

        expect(await screen.findByText("Cartera al día")).toBeInTheDocument();
        expect(screen.getByText("Nadie debe este año.")).toBeInTheDocument();
        expect(screen.getByText("Ningún curso debe este año.")).toBeInTheDocument();
    });

    it("mientras carga la cartera no dice que está al día", () => {
        iniciarSesionAdmin();
        apiMock.get.mockImplementation((url) => {
            if (url === "/cartera/mora/resumen") return new Promise(() => {});
            if (url === "/dashboard/cumpleanos/admin") return Promise.resolve({ data: cumpleanos });
            throw new Error(`GET inesperado: ${url}`);
        });

        render(<AdminDashboard />);

        expect(screen.getAllByText("Cargando la cartera…")).toHaveLength(3);
        expect(screen.queryByText("Cartera al día")).not.toBeInTheDocument();
        expect(screen.queryByText("Nadie debe este año.")).not.toBeInTheDocument();
    });

    it("conserva las demás secciones cuando falla el resumen de cartera", async () => {
        iniciarSesionAdmin();
        apiMock.get.mockImplementation((url) => {
            if (url === "/cartera/mora/resumen") return Promise.reject(new Error("500"));
            if (url === "/dashboard/cumpleanos/admin") return Promise.resolve({ data: cumpleanos });
            throw new Error(`GET inesperado: ${url}`);
        });

        render(<AdminDashboard />);

        expect(await screen.findByText("Ana Arias")).toBeInTheDocument();
        // El fallo se distingue de una cartera sana: nunca dice «Cartera al día».
        await waitFor(() => expect(screen.getAllByText(ERROR_CARTERA)).toHaveLength(3));
        expect(screen.queryByText("Cartera al día")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Abrir Gestión de Pagos" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Ver toda la cartera vencida" })).toBeInTheDocument();
    });

    it("conserva las demás secciones cuando fallan los cumpleaños", async () => {
        iniciarSesionAdmin();
        apiMock.get.mockImplementation((url) => {
            if (url === "/cartera/mora/resumen") return Promise.resolve({ data: resumenConDeuda });
            if (url === "/dashboard/cumpleanos/admin") return Promise.reject(new Error("500"));
            throw new Error(`GET inesperado: ${url}`);
        });

        render(<AdminDashboard />);

        expect(
            await screen.findByText("No se pudieron cargar los cumpleaños de la semana."),
        ).toBeInTheDocument();
        await waitFor(() => expect(porCobrar().textContent).toContain("1.250.000"));
        expect(screen.getByRole("button", { name: "Abrir Reportes" })).toBeInTheDocument();
    });

    it("pinta los cumpleaños en el muro, al final del panel", async () => {
        iniciarSesionAdmin();

        render(<AdminDashboard />);

        const muro = screen.getByRole("region", { name: "Cumpleaños de la semana" });
        expect(await screen.findByText("Ana Arias")).toBeInTheDocument();
        expect(muro).toHaveTextContent("Ana Arias");
        expect(muro).toHaveTextContent("5A");
    });

    it("pasa al muro el texto vacío del panel de admin", async () => {
        iniciarSesionAdmin();
        responder({ cumples: [] });

        render(<AdminDashboard />);

        expect(
            await screen.findByText("Esta semana no hay estudiantes activos de cumpleaños."),
        ).toBeInTheDocument();
    });

    it("mantiene los cuatro accesos con sus rutas", () => {
        iniciarSesionAdmin();

        render(<AdminDashboard />);

        const accesos = [
            ["Abrir Gestión de Pagos", "/admin/pagos"],
            ["Abrir Gestión de Estudiantes", "/admin/estudiantes"],
            ["Abrir Gestión Académica", "/admin"],
            ["Abrir Reportes", "/admin/reportes"],
        ];

        accesos.forEach(([etiqueta, ruta]) => {
            navigateMock.mockClear();
            fireEvent.click(screen.getByRole("button", { name: etiqueta }));
            expect(navigateMock).toHaveBeenCalledWith(ruta);
        });
    });

    it("abre un acceso con el teclado", () => {
        iniciarSesionAdmin();

        render(<AdminDashboard />);

        fireEvent.keyDown(screen.getByRole("button", { name: "Abrir Gestión Académica" }), {
            key: "Enter",
        });

        expect(navigateMock).toHaveBeenCalledWith("/admin");
    });
});
