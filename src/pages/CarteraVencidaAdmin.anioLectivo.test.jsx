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

import CarteraVencidaAdmin from "./CarteraVencidaAdmin";

const { apiMock } = mocks;
// Lo mismo que recibe la página fuera del proveedor (`useAnioLectivo`).
const ANIO_ACTIVO = {
    parametros: SIN_PARAMETROS_DE_ANIO,
    permisos: permisosAnio(null, null),
};
const CERRADO = {
    parametros: { anio_lectivo_id: 3 },
    permisos: { esAnioActivo: false, puedeEditar: false },
};
const CERRADO_CON_ANIO = { params: { anio_lectivo_id: 3 } };

// Mirando 2026 ya cerrado: Luis se retiró debiendo. El backend lo trae igual
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
    apiMock.get.mockImplementation((url) => {
        if (url === "/cartera/mora/resumen") {
            return Promise.resolve({ data: { total_deuda: 400000, total_estudiantes: 1 } });
        }
        if (url === "/cartera/mora") return Promise.resolve({ data: [LUIS] });
        return Promise.reject(new Error(`GET inesperado: ${url}`));
    });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("Cartera vencida mirando otro año", () => {
    it("pide el resumen y la lista de ese año y no ofrece Cobrar", async () => {
        mocks.anioLectivo = CERRADO;

        render(<CarteraVencidaAdmin />);

        expect(await screen.findByText("Gómez, Luis")).toBeInTheDocument();
        expect(apiMock.get.mock.calls).toEqual([
            ["/cartera/mora/resumen", CERRADO_CON_ANIO],
            ["/cartera/mora", CERRADO_CON_ANIO],
        ]);
        // Pagos cobra en el año activo: desde otro año no se ofrece cobrar.
        expect(screen.queryByRole("button", { name: /Cobrar/ })).not.toBeInTheDocument();
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
});

describe("Cartera vencida en el año activo", () => {
    it("Actualizar recarga la página, como siempre, y Cobrar sigue", async () => {
        mocks.anioLectivo = ANIO_ACTIVO;
        const reload = vi.fn();
        vi.stubGlobal("location", { ...window.location, reload });

        render(<CarteraVencidaAdmin />);
        await screen.findByText("Gómez, Luis");

        expect(screen.getByRole("button", { name: /Cobrar/ })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "↻ Actualizar" }));

        expect(reload).toHaveBeenCalledTimes(1);
        expect(apiMock.get.mock.calls).toEqual([
            ["/cartera/mora/resumen"],
            ["/cartera/mora"],
        ]);
    });
});
