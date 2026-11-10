import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useClasesProfesor from "./useClasesProfesor";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: { obtenerClasesProfesor: vi.fn() },
}));

vi.mock("../../services/dashboardsApi", () => serviceMock);

const clases = [
    { id: 10, horario_id: 501, materia: "Matemáticas", curso: "5A", curso_id: 100, jornada: "Mañana", dia: "Lunes", hora_inicio: "07:00", hora_fin: "08:00" },
    { id: 10, horario_id: 502, materia: "Matemáticas", curso: "5A", curso_id: 100, jornada: "Mañana", dia: "Miércoles", hora_inicio: "09:00", hora_fin: "10:00" },
    { id: 11, horario_id: 503, materia: "Español", curso: "5A", curso_id: 100, jornada: "Mañana", dia: "Martes", hora_inicio: "08:00", hora_fin: "09:00" },
    { id: 12, horario_id: 504, materia: "Sociales", curso: "6B", curso_id: 200, jornada: "Tarde", dia: "Jueves", hora_inicio: "13:00", hora_fin: "14:00" },
];

const montarCargado = async () => {
    const hook = renderHook(() => useClasesProfesor(7));
    await waitFor(() => expect(hook.result.current.loadingClases).toBe(false));
    return hook;
};

describe("useClasesProfesor", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        serviceMock.obtenerClasesProfesor.mockResolvedValue(clases);
    });

    it("no consulta cuando no hay profesor", () => {
        const { result } = renderHook(() => useClasesProfesor(undefined));

        expect(serviceMock.obtenerClasesProfesor).not.toHaveBeenCalled();
        expect(result.current.clasesUnicas).toEqual([]);
    });

    it("carga las clases y deduplica el selector por curso y materia", async () => {
        const { result } = await montarCargado();

        expect(serviceMock.obtenerClasesProfesor).toHaveBeenCalledWith(7);
        expect(result.current.clasesUnicas.map((clase) => clase.id)).toEqual([10, 11, 12]);
        expect(result.current.cursosProfesor).toEqual([
            { id: 100, nombre: "5A", jornada: "Mañana" },
            { id: 200, nombre: "6B", jornada: "Tarde" },
        ]);
    });

    it("el horario semanal sí conserva cada franja", async () => {
        const { result } = await montarCargado();

        expect(result.current.clasesConHorario).toHaveLength(4);
    });

    it("agrupa las clases por día, ordenadas por hora, y sabe si hay dos jornadas", async () => {
        const { result } = await montarCargado();

        expect(result.current.hayDosJornadas).toBe(true);
        expect(result.current.clasesPorDia.Lunes.map((clase) => clase.horario_id)).toEqual([501]);
        expect(result.current.clasesPorDia.Miércoles.map((clase) => clase.horario_id)).toEqual([502]);
        expect(result.current.clasesPorDia.Jueves[0].materia).toBe("Sociales");
        expect(result.current.clasesPorDia.Viernes).toEqual([]);
    });

    it("deja todo vacío cuando la consulta falla", async () => {
        serviceMock.obtenerClasesProfesor.mockRejectedValue(new Error("500"));

        const { result } = await montarCargado();

        expect(result.current.clasesUnicas).toEqual([]);
        expect(result.current.cursosProfesor).toEqual([]);
        expect(result.current.clasesConHorario).toEqual([]);
        expect(result.current.hayDosJornadas).toBe(false);
        expect(result.current.errorClases).toBe("No se pudieron cargar tus clases.");
    });
});
