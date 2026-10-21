import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SIN_PARAMETROS_DE_ANIO, permisosAnio } from "../utils/anioLectivo";

// Cartera vencida mirando un año que no es el activo (paso 4.3 del año
// lectivo). Con el año activo, `CarteraVencidaAdmin.test.jsx` sigue igual.
const mocks = vi.hoisted(() => ({
    apiMock: { get: vi.fn() },
    navigateMock: vi.fn(),
    anioLectivo: null,
}));

vi.mock("../utils/api", () => ({ default: mocks.apiMock }));
vi.mock("react-router-dom", async (importOriginal) => ({
    ...(await importOriginal()),
    useNavigate: () => mocks.navigateMock,
}));
vi.mock("../hooks/anioLectivo/useAnioLectivo", () => ({
    default: () => mocks.anioLectivo,
}));
vi.mock("../components/impresion/DocumentoImprimible", () => ({
    default: ({ children, subtitulo }) => (
        <div data-testid="documento-imprimible">
            <p>{subtitulo}</p>
            {children}
        </div>
    ),
}));

import CarteraVencidaAdmin from "./CarteraVencidaAdmin";

const { apiMock } = mocks;
// Lo mismo que recibe la página fuera del proveedor (`useAnioLectivo`).
const ANIO_ACTIVO = {
    anioActivo: { id: 1, anio: 2026, estado: "activo" },
    anioSeleccionado: { id: 1, anio: 2026, estado: "activo" },
    parametros: SIN_PARAMETROS_DE_ANIO,
    permisos: permisosAnio(null, null),
};
const CERRADO = {
    anioActivo: { id: 1, anio: 2026, estado: "activo" },
    anioSeleccionado: { id: 3, anio: 2025, estado: "cerrado" },
    parametros: { anio_lectivo_id: 3 },
    permisos: { esAnioActivo: false, puedeEditar: false },
};
const CERRADO_CON_ANIO = { params: { anio_lectivo_id: 3 } };

// Mirando 2025 ya cerrado: Luis se retiró debiendo. El backend lo trae igual
// y sin ventas (decisiones 18 y 19), y la pantalla lo muestra tal cual.
const LUIS = {
    estudiante_id: 2,
    nombre: "Luis",
    apellido: "Gómez",
    curso_id: 10,
    curso_nombre: "5A",
    deuda_academica: 400000,
    deuda_inventario: 0,
    mora: 0,
    total: 400000,
    cuotas_vencidas: 2,
    conceptos: [],
    ventas_pendientes: [],
};

beforeEach(() => {
    apiMock.get.mockReset();
    mocks.navigateMock.mockReset();
    // JSDOM no trae window.scrollTo; se simula para el impreso.
    window.scrollTo = vi.fn();
    apiMock.get.mockImplementation((url) => {
        if (url === "/cartera/mora/resumen") {
            return Promise.resolve({ data: { total_deuda: 400000, total_estudiantes: 1 } });
        }
        if (url === "/cartera/mora") return Promise.resolve({ data: [LUIS] });
        return Promise.reject(new Error(`GET inesperado: ${url}`));
    });
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe("Cartera vencida mirando otro año", () => {
    it("pide ese año y Cobrar lo conserva al abrir Pagos", async () => {
        mocks.anioLectivo = CERRADO;

        render(<CarteraVencidaAdmin />);

        expect(await screen.findByText("Gómez, Luis")).toBeInTheDocument();
        expect(apiMock.get.mock.calls).toEqual([
            ["/cartera/mora/resumen", CERRADO_CON_ANIO],
            ["/cartera/mora", CERRADO_CON_ANIO],
        ]);
        fireEvent.click(screen.getByRole("button", { name: /Cobrar/ }));
        expect(mocks.navigateMock).toHaveBeenCalledWith("/admin/pagos", {
            state: { estudiante_id: 2, anio_lectivo_id: 3 },
        });
        expect(screen.getByRole("button", { name: "Imprimir" })).toBeInTheDocument();
    });

    it("Actualizar vuelve a pedir la cartera de ese año, sin recargar la página", async () => {
        mocks.anioLectivo = CERRADO;
        const reload = vi.fn();
        vi.stubGlobal("location", { ...window.location, reload });

        render(<CarteraVencidaAdmin />);
        await screen.findByText("Gómez, Luis");
        fireEvent.click(screen.getByRole("button", { name: "↻ Actualizar" }));

        await waitFor(() => expect(apiMock.get).toHaveBeenCalledTimes(4));
        expect(await screen.findByText("Gómez, Luis")).toBeInTheDocument();
        expect(apiMock.get.mock.calls.slice(2)).toEqual([
            ["/cartera/mora/resumen", CERRADO_CON_ANIO],
            ["/cartera/mora", CERRADO_CON_ANIO],
        ]);
        expect(reload).not.toHaveBeenCalled();
    });

    it("identifica el año consultado en el impreso y en el nombre del CSV", async () => {
        mocks.anioLectivo = CERRADO;
        let nombreDescarga = "";
        Object.defineProperty(URL, "createObjectURL", {
            configurable: true,
            value: vi.fn(() => "blob:cartera"),
        });
        Object.defineProperty(URL, "revokeObjectURL", {
            configurable: true,
            value: vi.fn(),
        });
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
            nombreDescarga = this.download;
        });

        render(<CarteraVencidaAdmin />);
        await screen.findByText("Gómez, Luis");

        fireEvent.click(screen.getByRole("button", { name: "Imprimir" }));
        expect(
            screen.getByText("Estudiante: Gómez Luis · Año lectivo 2025"),
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "← Atrás" }));

        fireEvent.click(screen.getByRole("button", { name: "⬇ Exportar CSV" }));
        expect(nombreDescarga).toMatch(
            /^cartera_vencida_2025_\d{4}-\d{2}-\d{2}\.csv$/,
        );
    });
});

describe("Cartera vencida en el año activo", () => {
    // Hasta el 2026-10-21, en el año activo Actualizar recargaba la página
    // entera. Desde el paso 3 de EXPERIENCIA_CARTERA_NOMINA.md vuelve a pedir
    // la cartera, igual que mirando otro año: conserva filtros y fila abierta.
    it("Actualizar vuelve a pedir la cartera sin recargar la página, y Cobrar sigue", async () => {
        mocks.anioLectivo = ANIO_ACTIVO;
        const reload = vi.fn();
        vi.stubGlobal("location", { ...window.location, reload });

        render(<CarteraVencidaAdmin />);
        await screen.findByText("Gómez, Luis");

        expect(screen.getByRole("button", { name: /Cobrar/ })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "↻ Actualizar" }));

        await waitFor(() => expect(apiMock.get).toHaveBeenCalledTimes(4));
        expect(reload).not.toHaveBeenCalled();
        expect(apiMock.get.mock.calls).toEqual([
            ["/cartera/mora/resumen"],
            ["/cartera/mora"],
            ["/cartera/mora/resumen"],
            ["/cartera/mora"],
        ]);
    });
});
