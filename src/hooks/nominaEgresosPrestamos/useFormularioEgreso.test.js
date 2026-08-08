import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useFormularioEgreso from "./useFormularioEgreso";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: { actualizarEgreso: vi.fn(), crearEgreso: vi.fn() },
}));

vi.mock("../../services/nominaEgresosPrestamosApi", () => serviceMock);

const eventoFalso = { preventDefault: vi.fn() };

const egresoManual = {
    id: 10,
    concepto: "Papelería",
    monto: 150.5,
    fecha: "2026-08-05T00:00:00",
    categoria: "Compras Institucionales",
    notas: "Factura 12",
    origen: "manual",
    editable: true,
};

const egresoAutomatico = { ...egresoManual, id: 11, origen: "nomina", editable: false };

const montar = () => {
    const recargarRangoVigente = vi.fn().mockResolvedValue(undefined);
    const mostrarRangoDeUnDia = vi.fn().mockResolvedValue(undefined);
    const hook = renderHook(() =>
        useFormularioEgreso({ recargarRangoVigente, mostrarRangoDeUnDia })
    );
    return { ...hook, recargarRangoVigente, mostrarRangoDeUnDia };
};

const escribir = (result, campos) => {
    Object.entries(campos).forEach(([campo, valor]) => {
        act(() => result.current.cambiarCampo(campo, valor));
    });
};

describe("useFormularioEgreso", () => {
    beforeEach(() => {
        window.alert = vi.fn();
        window.confirm = vi.fn(() => true);
        serviceMock.crearEgreso.mockResolvedValue({ id: 12 });
        serviceMock.actualizarEgreso.mockResolvedValue({ id: 10 });
    });

    it("arranca vacío con la categoría inicial y sin egreso en edición", () => {
        const { result } = montar();

        expect(result.current.formulario).toEqual({
            concepto: "",
            monto: "",
            fecha: "",
            categoria: "Compras Institucionales",
            notas: "",
        });
        expect(result.current.egresoEditando).toBeNull();
    });

    it("registra un egreso nuevo y mueve el filtro a su fecha", async () => {
        const { result, mostrarRangoDeUnDia, recargarRangoVigente } = montar();
        escribir(result, {
            concepto: "  Aseo general  ",
            monto: "80000",
            fecha: "2026-08-01",
            categoria: "Mantenimiento",
        });

        await act(async () => {
            await result.current.guardarEgreso(eventoFalso);
        });

        expect(serviceMock.crearEgreso).toHaveBeenCalledWith({
            concepto: "Aseo general",
            monto: 80000,
            fecha: "2026-08-01",
            categoria: "Mantenimiento",
            notas: "",
        });
        expect(mostrarRangoDeUnDia).toHaveBeenCalledWith("2026-08-01");
        expect(recargarRangoVigente).not.toHaveBeenCalled();
        expect(result.current.formulario.concepto).toBe("");
        expect(result.current.formulario.categoria).toBe("Compras Institucionales");
    });

    it("carga un egreso manual y lo actualiza conservando el rango vigente", async () => {
        const { result, mostrarRangoDeUnDia, recargarRangoVigente } = montar();

        act(() => result.current.editarEgreso(egresoManual));

        expect(result.current.egresoEditando).toBe(egresoManual);
        expect(result.current.formulario).toEqual({
            concepto: "Papelería",
            monto: "150.5",
            fecha: "2026-08-05",
            categoria: "Compras Institucionales",
            notas: "Factura 12",
        });

        await act(async () => {
            await result.current.guardarEgreso(eventoFalso);
        });

        expect(serviceMock.actualizarEgreso).toHaveBeenCalledWith(10, {
            concepto: "Papelería",
            monto: 150.5,
            fecha: "2026-08-05",
            categoria: "Compras Institucionales",
            notas: "Factura 12",
        });
        expect(recargarRangoVigente).toHaveBeenCalledTimes(1);
        expect(mostrarRangoDeUnDia).not.toHaveBeenCalled();
        expect(result.current.egresoEditando).toBeNull();
    });

    it("rechaza cargar un egreso automático", () => {
        const { result } = montar();

        act(() => result.current.editarEgreso(egresoAutomatico));

        expect(window.alert).toHaveBeenCalledWith(
            "Solo puedes editar egresos creados manualmente en esta pantalla."
        );
        expect(result.current.egresoEditando).toBeNull();
        expect(result.current.formulario.concepto).toBe("");
    });

    it("valida antes de confirmar y no envía nada", async () => {
        const { result } = montar();
        escribir(result, { concepto: "   ", monto: "100" });

        await act(async () => {
            await result.current.guardarEgreso(eventoFalso);
        });

        expect(window.alert).toHaveBeenCalledWith("Debes escribir el concepto del egreso.");
        expect(window.confirm).not.toHaveBeenCalled();
        expect(serviceMock.crearEgreso).not.toHaveBeenCalled();
    });

    it("cancelar la confirmación no envía nada y conserva lo escrito", async () => {
        window.confirm = vi.fn(() => false);
        const { result } = montar();
        escribir(result, { concepto: "Aseo", monto: "1000" });

        await act(async () => {
            await result.current.guardarEgreso(eventoFalso);
        });

        expect(serviceMock.crearEgreso).not.toHaveBeenCalled();
        expect(result.current.formulario.concepto).toBe("Aseo");
    });

    it("limpiar la edición devuelve el formulario a su estado inicial", () => {
        const { result } = montar();
        act(() => result.current.editarEgreso(egresoManual));

        act(() => result.current.limpiarFormulario());

        expect(result.current.egresoEditando).toBeNull();
        expect(result.current.formulario.concepto).toBe("");
        expect(result.current.formulario.categoria).toBe("Compras Institucionales");
    });

    it("conserva el detalle del backend cuando falla el guardado", async () => {
        serviceMock.crearEgreso.mockRejectedValueOnce({
            response: { data: { detail: "Concepto duplicado" } },
        });
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result } = montar();
        escribir(result, { concepto: "Aseo", monto: "1000" });

        await act(async () => {
            await result.current.guardarEgreso(eventoFalso);
        });

        expect(window.alert).toHaveBeenCalledWith("Concepto duplicado");
        expect(result.current.formulario.concepto).toBe("Aseo");
        consoleError.mockRestore();
    });
});
