import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useConsultasNomina from "./useConsultasNomina";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: {
        obtenerEmpleadosNomina: vi.fn(),
        obtenerHistorialNomina: vi.fn(),
    },
}));

vi.mock("../../services/nominaEgresosPrestamosApi", () => serviceMock);

const empleados = [{ id: 1, nombre: "ana", apellido: "pérez", saldo_prestamos: 400 }];
const historial = [
    { id: 55, profesor: "Pérez Ana", total_pagado: 1450 },
    { id: 56, profesor: "Gómez Luis", total_pagado: 900 },
];

describe("useConsultasNomina", () => {
    beforeEach(() => {
        serviceMock.obtenerEmpleadosNomina.mockResolvedValue(empleados);
        serviceMock.obtenerHistorialNomina.mockResolvedValue(historial);
    });

    it("consulta empleados e historial al montar y termina el estado de carga", async () => {
        const { result } = renderHook(() => useConsultasNomina());

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        expect(result.current.empleados).toEqual(empleados);
        expect(result.current.error).toBe("");
        expect(serviceMock.obtenerEmpleadosNomina).toHaveBeenCalledTimes(1);
        expect(serviceMock.obtenerHistorialNomina).toHaveBeenCalledTimes(1);
    });

    it("oculta el historial hasta que se busca y luego lo filtra por nombre", async () => {
        const { result } = renderHook(() => useConsultasNomina());
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.hayBusqueda).toBe(false);
        expect(result.current.historialMostrado).toEqual([]);

        act(() => {
            result.current.setSearchHistorial("PÉREZ");
        });

        expect(result.current.hayBusqueda).toBe(true);
        expect(result.current.historialMostrado).toEqual([historial[0]]);

        act(() => {
            result.current.setSearchHistorial("zzz");
        });

        expect(result.current.historialMostrado).toEqual([]);
        expect(serviceMock.obtenerHistorialNomina).toHaveBeenCalledTimes(1);
    });

    it("publica el error de carga y deja de mostrar el indicador", async () => {
        const error = new Error("fallo");
        serviceMock.obtenerEmpleadosNomina.mockRejectedValueOnce(error);
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        const { result } = renderHook(() => useConsultasNomina());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        expect(result.current.error).toBe("No se pudo cargar la información de nómina.");
        expect(result.current.empleados).toEqual([]);
        expect(consoleError).toHaveBeenCalledWith("Error al cargar nómina:", error);
        consoleError.mockRestore();
    });

    it("recarga las dos consultas bajo demanda y limpia el error anterior", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        serviceMock.obtenerEmpleadosNomina.mockRejectedValueOnce(new Error("fallo"));
        const { result } = renderHook(() => useConsultasNomina());
        await waitFor(() => {
            expect(result.current.error).not.toBe("");
        });

        await act(async () => {
            await result.current.cargarDatos();
        });

        expect(result.current.error).toBe("");
        expect(result.current.empleados).toEqual(empleados);
        expect(serviceMock.obtenerEmpleadosNomina).toHaveBeenCalledTimes(2);
        expect(serviceMock.obtenerHistorialNomina).toHaveBeenCalledTimes(2);
        consoleError.mockRestore();
    });
});
