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

const resumenConMora = {
    total_deuda: 1250000,
    total_estudiantes: 3,
    total_mora: 80000,
};

const resumenAlDia = {
    total_deuda: 0,
    total_estudiantes: 0,
    total_mora: 0,
};

const cumpleanos = [
    { estudiante_id: 5, nombre: "Ana", apellido: "Arias", curso: "5A", fecha_nacimiento: "2012-08-07" },
];

const iniciarSesionAdmin = () => {
    localStorage.setItem("usuario", JSON.stringify({ id: 1, nombre: "carlos gómez", rol: "admin" }));
};

const responder = ({ resumen = resumenConMora, cumples = cumpleanos } = {}) => {
    apiMock.get.mockImplementation((url) => {
        if (url === "/cartera/mora/resumen") return Promise.resolve({ data: resumen });
        if (url === "/dashboard/cumpleanos/admin") return Promise.resolve({ data: cumples });
        throw new Error(`GET inesperado: ${url}`);
    });
};

const tarjetaCartera = () => screen.getByRole("button", { name: "Abrir cartera vencida" });

describe("AdminDashboard", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.spyOn(console, "error").mockImplementation(() => {});
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

    it("consulta el resumen de cartera y los cumpleaños de la semana", async () => {
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

        expect(screen.getByText("Carlos")).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { level: 1, name: "Panel de Administración" }),
        ).toBeInTheDocument();
    });

    it("muestra la deuda, la mora y el conteo cuando hay estudiantes en mora", async () => {
        iniciarSesionAdmin();

        render(<AdminDashboard />);

        const tarjeta = tarjetaCartera();
        await waitFor(() => {
            expect(tarjeta.textContent).toContain("1.250.000");
        });
        expect(tarjeta.textContent).toContain("3 estudiantes en mora");
        expect(tarjeta.textContent).toContain("80.000");
        expect(screen.getByText("3 en mora")).toBeInTheDocument();
        expect(screen.getByText("⚠️")).toBeInTheDocument();
    });

    it("muestra la cartera al día cuando no hay estudiantes en mora", async () => {
        iniciarSesionAdmin();
        responder({ resumen: resumenAlDia });

        render(<AdminDashboard />);

        expect(await screen.findByText("Cartera al día")).toBeInTheDocument();
        expect(screen.getByText("No hay estudiantes en mora actualmente.")).toBeInTheDocument();
        expect(screen.getByText("✅")).toBeInTheDocument();
        expect(screen.queryByText(/en mora$/)).not.toBeInTheDocument();
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
        expect(
            await screen.findByText("No se pudo cargar la cartera vencida."),
        ).toBeInTheDocument();
        expect(screen.getByText("Sin datos")).toBeInTheDocument();
        expect(screen.queryByText("Cartera al día")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Abrir Gestión de Pagos" })).toBeInTheDocument();
    });

    it("conserva las demás secciones cuando fallan los cumpleaños", async () => {
        iniciarSesionAdmin();
        apiMock.get.mockImplementation((url) => {
            if (url === "/cartera/mora/resumen") return Promise.resolve({ data: resumenConMora });
            if (url === "/dashboard/cumpleanos/admin") return Promise.reject(new Error("500"));
            throw new Error(`GET inesperado: ${url}`);
        });

        render(<AdminDashboard />);

        expect(
            await screen.findByText("No se pudieron cargar los cumpleaños de la semana."),
        ).toBeInTheDocument();
        expect(tarjetaCartera().textContent).toContain("1.250.000");
        expect(screen.getByRole("button", { name: "Abrir Reportes" })).toBeInTheDocument();
    });

    it("pasa a cumpleaños el rango y el texto vacío del panel de admin", async () => {
        iniciarSesionAdmin();
        responder({ cumples: [] });

        render(<AdminDashboard />);

        expect(
            await screen.findByText("Esta semana no hay estudiantes activos de cumpleaños."),
        ).toBeInTheDocument();
        expect(screen.getByText("🎂 0 en 7 días")).toBeInTheDocument();
    });

    it("mantiene los cuatro accesos principales con sus rutas", () => {
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

    it("abre la cartera vencida con clic, Enter y espacio", () => {
        iniciarSesionAdmin();

        render(<AdminDashboard />);

        fireEvent.click(tarjetaCartera());
        expect(navigateMock).toHaveBeenCalledWith("/admin/cartera-vencida");

        navigateMock.mockClear();
        fireEvent.keyDown(tarjetaCartera(), { key: "Enter" });
        expect(navigateMock).toHaveBeenCalledWith("/admin/cartera-vencida");

        navigateMock.mockClear();
        fireEvent.keyDown(tarjetaCartera(), { key: " " });
        expect(navigateMock).toHaveBeenCalledWith("/admin/cartera-vencida");

        navigateMock.mockClear();
        fireEvent.keyDown(tarjetaCartera(), { key: "Tab" });
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it("abre un acceso principal con el teclado", () => {
        iniciarSesionAdmin();

        render(<AdminDashboard />);

        fireEvent.keyDown(screen.getByRole("button", { name: "Abrir Gestión Académica" }), {
            key: "Enter",
        });

        expect(navigateMock).toHaveBeenCalledWith("/admin");
    });
});
