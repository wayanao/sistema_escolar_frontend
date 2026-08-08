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

const descartar = vi.fn();

const montarCargado = async (asignacionId = "") => {
    const hook = renderHook(() => useClasesProfesor(7, asignacionId, descartar));
    await waitFor(() => expect(hook.result.current.loadingClases).toBe(false));
    return hook;
};

describe("useClasesProfesor", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        descartar.mockClear();
        serviceMock.obtenerClasesProfesor.mockResolvedValue(clases);
    });

    it("no consulta cuando no hay profesor", () => {
        const { result } = renderHook(() => useClasesProfesor(undefined, "", descartar));

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
        expect(result.current.clasesPorJornada["Mañana"]).toHaveLength(3);
        expect(result.current.clasesPorJornada["Tarde"]).toHaveLength(1);
        expect(result.current.horarioPorJornada["Tarde"].Jueves).toHaveLength(1);
    });

    it("pide descartar la clase guardada al terminar la carga", async () => {
        await montarCargado();

        expect(descartar).toHaveBeenCalledWith(clases);
    });

    it("resuelve la clase seleccionada por su identificador", async () => {
        const { result } = await montarCargado("11");

        expect(result.current.claseSeleccionada.materia).toBe("Español");
    });

    it("deja la clase seleccionada en nulo cuando no existe", async () => {
        const { result } = await montarCargado("999");

        expect(result.current.claseSeleccionada).toBeNull();
    });

    it("ofrece el filtro de jornada y respeta la elegida", async () => {
        const { result } = await montarCargado();

        expect(result.current.hayDosJornadas).toBe(true);
        expect(result.current.filtroJornada).toBe("Ambas");
        expect(result.current.jornadasVisibles).toEqual(["Mañana", "Tarde"]);

        result.current.setFiltroJornada("Tarde");
        await waitFor(() => expect(result.current.jornadasVisibles).toEqual(["Tarde"]));
    });

    it("deja todo vacío cuando la consulta falla", async () => {
        serviceMock.obtenerClasesProfesor.mockRejectedValue(new Error("500"));

        const { result } = await montarCargado();

        expect(result.current.clasesUnicas).toEqual([]);
        expect(result.current.cursosProfesor).toEqual([]);
        expect(result.current.clasesConHorario).toEqual([]);
        expect(result.current.hayDosJornadas).toBe(false);
        expect(descartar).not.toHaveBeenCalled();
    });
});
