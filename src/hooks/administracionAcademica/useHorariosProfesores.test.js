import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { listarHorariosAdminMock } = vi.hoisted(() => ({
    listarHorariosAdminMock: vi.fn(),
}));

vi.mock("../../services/horariosApi", () => ({
    listarHorariosAdmin: listarHorariosAdminMock,
}));

import useHorariosProfesores from "./useHorariosProfesores";

const HORARIOS = [
    {
        profesor: "Ana Torres",
        curso: "7B",
        materia: "MATEMÁTICAS",
        dia: "Lunes",
        hora_inicio: "08:00",
        hora_fin: "09:00",
    },
    {
        profesor: "Luis Pérez",
        curso: "6A",
        materia: "BIOLOGÍA",
        dia: "Martes",
        hora_inicio: "10:00",
        hora_fin: "11:00",
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    listarHorariosAdminMock.mockResolvedValue(HORARIOS);
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useHorariosProfesores", () => {
    it("carga con señal, selecciona el primer profesor y deriva sus horarios", async () => {
        const { result } = renderHook(() => useHorariosProfesores());

        expect(result.current.cargando).toBe(true);
        await waitFor(() => expect(result.current.cargando).toBe(false));

        expect(listarHorariosAdminMock).toHaveBeenCalledWith({
            signal: expect.any(AbortSignal),
        });
        expect(result.current.horarios).toBe(HORARIOS);
        expect(result.current.profesoresUnicos).toEqual(["Ana Torres", "Luis Pérez"]);
        expect(result.current.profesorSeleccionado).toBe("Ana Torres");
        expect(result.current.horariosDelProfesor).toEqual([HORARIOS[0]]);
    });

    it("cambia el profesor seleccionado y actualiza los horarios derivados", async () => {
        const { result } = renderHook(() => useHorariosProfesores());
        await waitFor(() => expect(result.current.cargando).toBe(false));

        act(() => {
            result.current.setProfesorSeleccionado("Luis Pérez");
        });

        expect(result.current.profesorSeleccionado).toBe("Luis Pérez");
        expect(result.current.horariosDelProfesor).toEqual([HORARIOS[1]]);
    });

    it("conserva el mensaje de error y cancela la solicitud al desmontar", async () => {
        const error = new Error("Sin conexión");
        listarHorariosAdminMock.mockRejectedValueOnce(error);
        const { result } = renderHook(() => useHorariosProfesores());

        await waitFor(() => expect(console.error).toHaveBeenCalledWith(
            "Error cargando horarios:",
            error,
        ));
        expect(result.current.cargando).toBe(false);
        expect(result.current.horarios).toEqual([]);

        listarHorariosAdminMock.mockImplementationOnce(() => new Promise(() => {}));
        const pendiente = renderHook(() => useHorariosProfesores());
        const signal = listarHorariosAdminMock.mock.calls[1][0].signal;

        pendiente.unmount();

        expect(signal.aborted).toBe(true);
    });
});

describe("useHorariosProfesores con un año elegido", () => {
    it("pide los horarios de ese año", async () => {
        const parametrosAnio = { anio_lectivo_id: 2 };
        const { result } = renderHook(() => useHorariosProfesores({ parametrosAnio }));

        await waitFor(() => expect(result.current.cargando).toBe(false));
        expect(listarHorariosAdminMock).toHaveBeenCalledWith({
            signal: expect.any(AbortSignal),
            parametrosAnio,
        });
    });
});
