import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { listarHorariosAdminMock } = vi.hoisted(() => ({
    listarHorariosAdminMock: vi.fn(),
}));

vi.mock("../../services/horariosApi", () => ({
    listarHorariosAdmin: listarHorariosAdminMock,
}));

import useHorariosPorCurso from "./useHorariosPorCurso";

const HORARIOS = [
    {
        profesor: "Ana Torres",
        curso: "7B",
        materia: "QUÍMICA",
        dia: "Lunes",
        hora_inicio: "10:00",
        hora_fin: "11:00",
    },
    {
        profesor: "Marta Ruiz",
        curso: "6A",
        materia: "ESPAÑOL",
        dia: "Martes",
        hora_inicio: "06:30",
        hora_fin: "07:30",
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

describe("useHorariosPorCurso", () => {
    it("carga con señal y conserva selección inicial y opciones ordenadas", async () => {
        const { result } = renderHook(() => useHorariosPorCurso());

        expect(result.current.cargando).toBe(true);
        await waitFor(() => expect(result.current.cargando).toBe(false));

        expect(listarHorariosAdminMock).toHaveBeenCalledWith({
            signal: expect.any(AbortSignal),
        });
        expect(result.current.horarios).toBe(HORARIOS);
        expect(result.current.cursoSeleccionado).toBe("7B");
        expect(result.current.cursosFiltrados).toEqual(["6A", "7B"]);
        expect(result.current.horariosDelCurso).toEqual([HORARIOS[0]]);
    });

    it("filtra, selecciona la primera coincidencia y conserva selección sin resultados", async () => {
        const { result } = renderHook(() => useHorariosPorCurso());
        await waitFor(() => expect(result.current.cargando).toBe(false));

        act(() => {
            result.current.setBusqueda(" 6 ");
        });

        await waitFor(() => expect(result.current.cursoSeleccionado).toBe("6A"));
        expect(result.current.cursosFiltrados).toEqual(["6A"]);
        expect(result.current.horariosDelCurso).toEqual([HORARIOS[1]]);

        act(() => {
            result.current.setBusqueda("sin curso");
        });

        expect(result.current.cursosFiltrados).toEqual([]);
        expect(result.current.cursoSeleccionado).toBe("6A");
        expect(result.current.horariosDelCurso).toEqual([HORARIOS[1]]);
    });

    it("permite selección manual y conserva error y cancelación", async () => {
        const { result } = renderHook(() => useHorariosPorCurso());
        await waitFor(() => expect(result.current.cargando).toBe(false));

        act(() => {
            result.current.setCursoSeleccionado("6A");
        });
        expect(result.current.horariosDelCurso).toEqual([HORARIOS[1]]);

        const error = new Error("Sin conexión");
        listarHorariosAdminMock.mockRejectedValueOnce(error);
        const fallido = renderHook(() => useHorariosPorCurso());
        await waitFor(() => expect(console.error).toHaveBeenCalledWith(
            "Error cargando horarios por curso:",
            error,
        ));
        expect(fallido.result.current.cargando).toBe(false);
        expect(fallido.result.current.horarios).toEqual([]);

        listarHorariosAdminMock.mockImplementationOnce(() => new Promise(() => {}));
        const pendiente = renderHook(() => useHorariosPorCurso());
        const signal = listarHorariosAdminMock.mock.calls[2][0].signal;
        pendiente.unmount();

        expect(signal.aborted).toBe(true);
    });
});

describe("useHorariosPorCurso con un año elegido", () => {
    it("pide los horarios de ese año", async () => {
        const parametrosAnio = { anio_lectivo_id: 2 };
        const { result } = renderHook(() => useHorariosPorCurso({ parametrosAnio }));

        await waitFor(() => expect(result.current.cargando).toBe(false));
        expect(listarHorariosAdminMock).toHaveBeenCalledWith({
            signal: expect.any(AbortSignal),
            parametrosAnio,
        });
    });
});
