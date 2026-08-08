import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useRendimientoProfesor from "./useRendimientoProfesor";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: {
        obtenerNotasBajasProfesor: vi.fn(),
        obtenerNotasAltasProfesor: vi.fn(),
    },
}));

vi.mock("../../services/dashboardsApi", () => serviceMock);

const clasesUnicas = [
    { id: 10, materia: "Matemáticas", curso_id: 100 },
    { id: 11, materia: "Español", curso_id: 100 },
    { id: 12, materia: "Sociales", curso_id: 200 },
];

const cursos = [
    { id: 100, nombre: "5A", jornada: "Mañana" },
    { id: 200, nombre: "6B", jornada: "Tarde" },
];

const notasBajas = [{ nombre: "Ana", promedio: 2.3 }];
const notasAltas = [{ nombre: "Zoe", promedio: 4.8 }];

const montarCargado = async (cursosProfesor = cursos) => {
    const hook = renderHook(() => useRendimientoProfesor(7, clasesUnicas, cursosProfesor));
    await waitFor(() => expect(hook.result.current.notasBajas).toEqual(notasBajas));
    return hook;
};

describe("useRendimientoProfesor", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        serviceMock.obtenerNotasBajasProfesor.mockResolvedValue(notasBajas);
        serviceMock.obtenerNotasAltasProfesor.mockResolvedValue(notasAltas);
    });

    it("elige el primer curso y consulta sin materia concreta", async () => {
        const { result } = await montarCargado();

        expect(result.current.cursoFiltro).toBe("100");
        expect(result.current.materiaFiltro).toBe("todas");
        expect(serviceMock.obtenerNotasBajasProfesor).toHaveBeenCalledWith(7, {
            curso_id: "100",
        });
        expect(serviceMock.obtenerNotasAltasProfesor).toHaveBeenCalledWith(7, {
            curso_id: "100",
        });
        expect(result.current.notasAltas).toEqual(notasAltas);
    });

    it("no consulta cuando el profesor no tiene cursos", async () => {
        const { result } = renderHook(() => useRendimientoProfesor(7, clasesUnicas, []));

        await waitFor(() => expect(result.current.loadingRendimiento).toBe(false));

        expect(serviceMock.obtenerNotasBajasProfesor).not.toHaveBeenCalled();
        expect(serviceMock.obtenerNotasAltasProfesor).not.toHaveBeenCalled();
        expect(result.current.notasBajas).toEqual([]);
        expect(result.current.cursoFiltroNombre).toBe("Curso");
    });

    it("no consulta cuando no hay profesor", async () => {
        renderHook(() => useRendimientoProfesor(undefined, clasesUnicas, cursos));

        expect(serviceMock.obtenerNotasBajasProfesor).not.toHaveBeenCalled();
    });

    it("agrega la asignación al elegir una materia concreta", async () => {
        const { result } = await montarCargado();

        act(() => result.current.setMateriaFiltro("10"));

        await waitFor(() => {
            expect(serviceMock.obtenerNotasBajasProfesor).toHaveBeenLastCalledWith(7, {
                curso_id: "100",
                asignacion_id: "10",
            });
        });
        expect(result.current.materiaFiltroNombre).toBe("Matemáticas");
    });

    it("cambiar de curso devuelve la materia a todas", async () => {
        const { result } = await montarCargado();

        act(() => result.current.setMateriaFiltro("10"));
        await waitFor(() => expect(result.current.materiaFiltro).toBe("10"));

        act(() => result.current.cambiarCurso("200"));

        expect(result.current.materiaFiltro).toBe("todas");
        await waitFor(() => {
            expect(serviceMock.obtenerNotasBajasProfesor).toHaveBeenLastCalledWith(7, {
                curso_id: "200",
            });
        });
    });

    it("limita las materias al curso elegido y nombra los dos filtros", async () => {
        const { result } = await montarCargado();

        expect(result.current.materiasDelCurso.map((clase) => clase.materia)).toEqual([
            "Español",
            "Matemáticas",
        ]);
        expect(result.current.cursoFiltroNombre).toBe("5A - Mañana");
        expect(result.current.materiaFiltroNombre).toBe("Todas las materias");
    });

    it("protege las listas ante respuestas vacías", async () => {
        serviceMock.obtenerNotasBajasProfesor.mockResolvedValue(null);
        serviceMock.obtenerNotasAltasProfesor.mockResolvedValue(undefined);

        const { result } = renderHook(() => useRendimientoProfesor(7, clasesUnicas, cursos));

        await waitFor(() => expect(result.current.loadingRendimiento).toBe(false));
        expect(result.current.notasBajas).toEqual([]);
        expect(result.current.notasAltas).toEqual([]);
    });

    it("deja las listas vacías cuando la consulta falla", async () => {
        serviceMock.obtenerNotasBajasProfesor.mockRejectedValue(new Error("500"));

        const { result } = renderHook(() => useRendimientoProfesor(7, clasesUnicas, cursos));

        await waitFor(() => expect(result.current.loadingRendimiento).toBe(false));
        expect(result.current.notasBajas).toEqual([]);
        expect(result.current.notasAltas).toEqual([]);
        expect(result.current.errorRendimiento).toBe("No se pudo cargar el rendimiento del curso.");
    });

    it("limpia el error al volver a consultar con éxito", async () => {
        serviceMock.obtenerNotasBajasProfesor.mockRejectedValueOnce(new Error("500"));

        const { result } = renderHook(() => useRendimientoProfesor(7, clasesUnicas, cursos));
        await waitFor(() => expect(result.current.errorRendimiento).toBeTruthy());

        act(() => result.current.cambiarCurso("200"));

        await waitFor(() => expect(result.current.errorRendimiento).toBe(""));
        expect(result.current.notasBajas).toEqual(notasBajas);
    });
});
