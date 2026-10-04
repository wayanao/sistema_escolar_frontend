import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Tipos de pago mirando un año que no es el activo (paso 4.3 del año lectivo).
// Con el año activo, `TiposPagosAdmin.test.jsx` sigue igual: fuera del
// proveedor, `useAnioLectivo` devuelve el año activo.
const mocks = vi.hoisted(() => ({
    apiMock: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
    swalFireMock: vi.fn(),
    anioLectivo: null,
}));

vi.mock("../utils/api", () => ({ default: mocks.apiMock }));
vi.mock("sweetalert2", () => ({ default: { fire: mocks.swalFireMock } }));
vi.mock("../hooks/anioLectivo/useAnioLectivo", () => ({
    default: () => mocks.anioLectivo,
}));

import TiposPagosAdmin from "./TiposPagosAdmin";

const { apiMock, swalFireMock } = mocks;
const PARAMETROS_2027 = { anio_lectivo_id: 2 };
const EN_PREPARACION = {
    parametros: PARAMETROS_2027,
    permisos: { esAnioActivo: false, puedeEditar: true },
};
const CERRADO = {
    parametros: { anio_lectivo_id: 3 },
    permisos: { esAnioActivo: false, puedeEditar: false },
};

const MATRICULA_2027 = {
    id: 7,
    nombre: "MATRÍCULA",
    valor: 400000,
    tipo_cobro: "anual",
    activo: true,
    cursos: [{ curso_id: 50, curso_nombre: "PRIMERO A", valor: 400000, activo: true }],
};
const CURSOS_2027 = [
    { id: 50, nombre: "PRIMERO A", estado: "activo" },
    { id: 51, nombre: "SEGUNDO A", estado: "activo" },
];

beforeEach(() => {
    Object.values(apiMock).forEach((mock) => mock.mockReset());
    swalFireMock.mockReset();
    apiMock.get.mockImplementation((url) => {
        if (url === "/tipos-pagos/detallado") return Promise.resolve({ data: [MATRICULA_2027] });
        if (url === "/cursos") return Promise.resolve({ data: CURSOS_2027 });
        if (url === "/tipos-pagos/7/detalle") {
            return Promise.resolve({ data: { ...MATRICULA_2027, mes_inicial: 2 } });
        }
        return Promise.reject(new Error(`GET inesperado: ${url}`));
    });
    apiMock.post.mockResolvedValue({ status: 201, data: {} });
    apiMock.put.mockResolvedValue({ status: 200, data: {} });
    swalFireMock.mockResolvedValue({ isConfirmed: true });
});

describe("Tipos de pago mirando otro año", () => {
    it("en preparación pide conceptos y cursos de ese año, no ofrece crear y deja editar", async () => {
        mocks.anioLectivo = EN_PREPARACION;
        render(<TiposPagosAdmin />);

        expect(await screen.findByText("MATRÍCULA")).toBeInTheDocument();
        const conAnio = { params: PARAMETROS_2027 };
        expect(apiMock.get).toHaveBeenCalledWith("/tipos-pagos/detallado", conAnio);
        await waitFor(() => expect(apiMock.get).toHaveBeenCalledWith("/cursos", conAnio));
        // Un concepto nuevo nacería en el año activo: mirando otro año no se crea.
        expect(screen.queryByRole("button", { name: "Guardar Concepto" })).not.toBeInTheDocument();

        fireEvent.click(screen.getByTitle("Editar nombre/valor"));
        fireEvent.click(screen.getByRole("button", { name: "Actualizar Concepto" }));

        await waitFor(() => expect(apiMock.put).toHaveBeenCalledWith(
            "/tipos-pagos/7",
            { nombre: "MATRÍCULA", valor: 400000 },
        ));
        // Después de guardar, la lista se vuelve a pedir del mismo año.
        await waitFor(() => expect(
            apiMock.get.mock.calls.filter(([url]) => url === "/tipos-pagos/detallado"),
        ).toEqual([
            ["/tipos-pagos/detallado", conAnio],
            ["/tipos-pagos/detallado", conAnio],
        ]));
    });

    it("en preparación se configuran el concepto y sus precios con los cursos de ese año", async () => {
        mocks.anioLectivo = EN_PREPARACION;
        render(<TiposPagosAdmin />);
        await screen.findByText("MATRÍCULA");

        fireEvent.click(screen.getByRole("button", { name: "⚙️ Configurar" }));
        expect(await screen.findByText("Configuración de recurrencia")).toBeInTheDocument();
        // El detalle parte del id del concepto: no lleva año.
        expect(apiMock.get).toHaveBeenCalledWith("/tipos-pagos/7/detalle");

        fireEvent.click(screen.getByRole("button", { name: "Guardar configuración" }));
        await waitFor(() => expect(apiMock.put).toHaveBeenCalledWith(
            "/tipos-pagos/7/configuracion",
            expect.objectContaining({ tipo_cobro: "anual", mes_inicial: 2 }),
        ));

        // Los cursos que se ofrecen para los precios son los de ese año.
        expect(screen.getByRole("option", { name: "SEGUNDO A" })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "+ Agregar todos los cursos" }));
        fireEvent.click(screen.getByRole("button", { name: "Guardar asignación de cursos" }));

        await waitFor(() => expect(apiMock.put).toHaveBeenCalledWith("/tipos-pagos/7/cursos", {
            cursos: [
                { curso_id: 50, valor: 400000, activo: true },
                { curso_id: 51, valor: 400000, activo: true },
            ],
        }));
    });

    it("en un año cerrado solo se consulta: sin crear, sin ✏️ y sin guardar", async () => {
        mocks.anioLectivo = CERRADO;
        render(<TiposPagosAdmin />);

        expect(await screen.findByText("MATRÍCULA")).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledWith("/tipos-pagos/detallado", {
            params: { anio_lectivo_id: 3 },
        });
        expect(screen.queryByRole("button", { name: "Guardar Concepto" })).not.toBeInTheDocument();
        expect(screen.queryByTitle("Editar nombre/valor")).not.toBeInTheDocument();

        // Configurar abre el concepto para mirarlo, con todo bloqueado.
        fireEvent.click(screen.getByRole("button", { name: "⚙️ Configurar" }));
        expect(await screen.findByText("Configuración de recurrencia")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Guardar configuración" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /asignación de cursos/ })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "+ Agregar todos los cursos" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Quitar" })).toBeDisabled();

        expect(apiMock.put).not.toHaveBeenCalled();
        expect(apiMock.post).not.toHaveBeenCalled();
    });
});
