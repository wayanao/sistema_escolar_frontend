import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useTenants from "./useTenants";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: { listarTenants: vi.fn() },
}));

vi.mock("../../services/dashboardsApi", () => serviceMock);

const tenants = [
    { id: 1, nombre: "Colegio Uno", estado: "activo" },
    { id: 2, nombre: "Colegio Dos", estado: "en_mora", estado_manual: "activo" },
    { id: 3, nombre: "Colegio Tres" },
];

const montarCargado = async () => {
    const hook = renderHook(() => useTenants());
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    return hook;
};

describe("useTenants", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        serviceMock.listarTenants.mockResolvedValue(tenants);
    });

    it("consulta la lista al montar y resume los estados", async () => {
        const { result } = renderHook(() => useTenants());

        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.tenants).toEqual(tenants);
        expect(result.current.error).toBe("");
        // El tenant sin estado cuenta como suspendido.
        expect(result.current.resumen).toEqual({
            total: 3,
            activo: 1,
            en_mora: 1,
            suspendido: 1,
            cancelado: 0,
        });
        expect(serviceMock.listarTenants).toHaveBeenCalledTimes(1);
    });

    it("protege la lista ante una respuesta vacía", async () => {
        serviceMock.listarTenants.mockResolvedValue(null);

        const { result } = await montarCargado();

        expect(result.current.tenants).toEqual([]);
        expect(result.current.resumen.total).toBe(0);
    });

    it("publica el error de carga y deja la lista vacía", async () => {
        serviceMock.listarTenants.mockRejectedValue(new Error("500"));

        const { result } = await montarCargado();

        expect(result.current.error).toBe("No se pudieron cargar los colegios.");
        expect(result.current.tenants).toEqual([]);
    });

    it("la recarga limpia el error anterior", async () => {
        serviceMock.listarTenants.mockRejectedValueOnce(new Error("500"));

        const { result } = await montarCargado();
        expect(result.current.error).toBeTruthy();

        await act(async () => {
            await result.current.cargarTenants();
        });

        expect(result.current.error).toBe("");
        expect(result.current.tenants).toEqual(tenants);
        expect(serviceMock.listarTenants).toHaveBeenCalledTimes(2);
    });

    it("agrega el colegio creado al final sin reordenar ni reconsultar", async () => {
        const { result } = await montarCargado();
        const creado = { id: 0, nombre: "AAA Colegio", estado: "activo" };

        act(() => result.current.agregarTenant(creado));

        expect(result.current.tenants.at(-1)).toBe(creado);
        expect(result.current.resumen).toMatchObject({ total: 4, activo: 2 });
        expect(serviceMock.listarTenants).toHaveBeenCalledTimes(1);
    });

    it("reemplaza la fila por el identificador de la fila editada", async () => {
        const { result } = await montarCargado();
        const actualizado = { id: 1, nombre: "Colegio Uno", estado: "suspendido" };

        act(() => result.current.reemplazarTenant(1, actualizado));

        expect(result.current.tenants[0]).toBe(actualizado);
        expect(result.current.tenants).toHaveLength(3);
        expect(result.current.resumen).toMatchObject({ activo: 0, suspendido: 2 });
    });
});
