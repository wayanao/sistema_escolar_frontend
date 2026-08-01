import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { actualizarMock, crearMock, desactivarMock } = vi.hoisted(() => ({
    actualizarMock: vi.fn(),
    crearMock: vi.fn(),
    desactivarMock: vi.fn(),
}));

vi.mock("../../services/asignacionesApi", () => ({
    actualizarAsignacion: actualizarMock,
    crearAsignacion: crearMock,
    desactivarAsignacion: desactivarMock,
}));

import useComandosAsignaciones from "./useComandosAsignaciones";

const CURSOS = [{ id: 21, nombre: "5A", jornada: "Mañana" }];
const ASIGNACION = {
    id: 41,
    curso_id: 21,
    profesor_id: 11,
    materia_id: 31,
    dia: "Lunes",
    hora_inicio: "08:00",
    hora_fin: "09:00",
    profesor_nombre: "ANA RUIZ",
    materia_nombre: "MATEMÁTICAS",
};

function crearHook({ asignaciones = [ASIGNACION], recargar = vi.fn() } = {}) {
    return {
        recargar,
        ...renderHook(() => useComandosAsignaciones({
            cursos: CURSOS,
            listaAsignaciones: asignaciones,
            recargar,
        })),
    };
}

function completarFormulario(result) {
    act(() => {
        result.current.seleccionarCurso("21");
        result.current.actualizarCampo("profesorId", "11");
        result.current.actualizarCampo("materiaId", "31");
        result.current.actualizarCampo("dia", "Lunes");
        result.current.actualizarCampo("horaInicio", "08:00");
        result.current.actualizarCampo("horaFin", "09:00");
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    actualizarMock.mockResolvedValue({});
    crearMock.mockResolvedValue({});
    desactivarMock.mockResolvedValue({});
    window.confirm = vi.fn();
    window.scrollTo = vi.fn();
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe("useComandosAsignaciones", () => {
    it("controla selección, edición y limpieza conservando el curso de trabajo", () => {
        const { result } = crearHook({
            asignaciones: [
                { ...ASIGNACION, id: 42, dia: "Martes", hora_inicio: "07:00" },
                ASIGNACION,
            ],
        });

        act(() => result.current.seleccionarCurso("21"));
        expect(result.current.cursoSeleccionado).toEqual(CURSOS[0]);
        expect(result.current.asignacionesCurso.map(({ id }) => id)).toEqual([41, 42]);

        act(() => result.current.iniciarEdicion(ASIGNACION));
        expect(result.current.editandoId).toBe(41);
        expect(result.current.profesorId).toBe("11");
        expect(result.current.materiaId).toBe("31");
        expect(result.current.dia).toBe("Lunes");
        expect(result.current.horaInicio).toBe("08:00");
        expect(result.current.horaFin).toBe("09:00");
        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });

        act(() => result.current.cancelarEdicion());
        expect(result.current.cursoId).toBe("21");
        expect(result.current.profesorId).toBe("");
        expect(result.current.materiaId).toBe("");
        expect(result.current.editandoId).toBeNull();
    });

    it("valida antes de enviar y conserva el mensaje actual", async () => {
        const { result } = crearHook({ asignaciones: [] });
        act(() => result.current.seleccionarCurso("21"));

        await act(async () => result.current.guardarAsignacion());

        expect(result.current.mensajeEstado).toBe(
            "Completa curso, profesor, materia, día y horas.",
        );
        expect(crearMock).not.toHaveBeenCalled();
        expect(actualizarMock).not.toHaveBeenCalled();
    });

    it("crea con el payload vigente, limpia el formulario y recarga silenciosamente", async () => {
        vi.useFakeTimers();
        const recargar = vi.fn().mockResolvedValue(undefined);
        const { result } = crearHook({ asignaciones: [], recargar });
        completarFormulario(result);

        await act(async () => result.current.guardarAsignacion());

        expect(crearMock).toHaveBeenCalledWith({
            profesor_id: 11,
            curso_id: 21,
            materia_id: 31,
            dia: "Lunes",
            hora_inicio: "08:00",
            hora_fin: "09:00",
        });
        expect(recargar).toHaveBeenCalledWith({ mostrarCarga: false });
        expect(result.current.mensajeEstado).toBe("Asignación creada correctamente.");
        expect(result.current.cursoId).toBe("21");
        expect(result.current.profesorId).toBe("");
        expect(result.current.guardando).toBe(false);

        act(() => vi.advanceTimersByTime(3500));
        expect(result.current.mensajeEstado).toBe("");
    });

    it("actualiza la asignación en edición con el mismo contrato", async () => {
        const recargar = vi.fn().mockResolvedValue(undefined);
        const { result } = crearHook({ recargar });
        act(() => result.current.iniciarEdicion(ASIGNACION));

        await act(async () => result.current.guardarAsignacion());

        expect(actualizarMock).toHaveBeenCalledWith(41, {
            profesor_id: 11,
            curso_id: 21,
            materia_id: 31,
            dia: "Lunes",
            hora_inicio: "08:00",
            hora_fin: "09:00",
        });
        expect(crearMock).not.toHaveBeenCalled();
        expect(result.current.mensajeEstado).toBe("Asignación actualizada correctamente.");
        expect(result.current.editandoId).toBeNull();
    });

    it("conserva el detalle del backend cuando falla el guardado", async () => {
        crearMock.mockRejectedValue({
            response: { data: { detail: "El profesor ya tiene una clase en ese horario." } },
        });
        const recargar = vi.fn();
        const { result } = crearHook({ asignaciones: [], recargar });
        completarFormulario(result);

        await act(async () => result.current.guardarAsignacion());

        expect(result.current.mensajeEstado).toBe(
            "El profesor ya tiene una clase en ese horario.",
        );
        expect(recargar).not.toHaveBeenCalled();
        expect(result.current.guardando).toBe(false);
    });

    it("confirma y desactiva sin borrar el contexto del curso", async () => {
        const recargar = vi.fn().mockResolvedValue(undefined);
        const { result } = crearHook({ recargar });
        act(() => result.current.iniciarEdicion(ASIGNACION));

        await act(async () => result.current.desactivarAsignacion(ASIGNACION));
        expect(desactivarMock).not.toHaveBeenCalled();

        window.confirm.mockReturnValue(true);
        await act(async () => result.current.desactivarAsignacion(ASIGNACION));

        expect(window.confirm).toHaveBeenLastCalledWith(
            "¿Desactivar esta asignación? No se borrarán planes de clase, notas, asistencia ni boletines históricos.",
        );
        expect(desactivarMock).toHaveBeenCalledWith(41);
        expect(recargar).toHaveBeenCalledWith({ mostrarCarga: false });
        expect(result.current.mensajeEstado).toBe("Asignación desactivada correctamente.");
        expect(result.current.cursoId).toBe("21");
        expect(result.current.editandoId).toBeNull();
    });

    it("conserva el detalle del backend cuando falla la desactivación", async () => {
        desactivarMock.mockRejectedValue({
            response: { data: { detail: "La asignación tiene un conflicto activo." } },
        });
        window.confirm.mockReturnValue(true);
        const recargar = vi.fn();
        const { result } = crearHook({ recargar });

        await act(async () => result.current.desactivarAsignacion(ASIGNACION));

        expect(result.current.mensajeEstado).toBe("La asignación tiene un conflicto activo.");
        expect(recargar).not.toHaveBeenCalled();
        expect(result.current.guardando).toBe(false);
    });
});
