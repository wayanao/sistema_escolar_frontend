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

    it("descarta la respuesta lenta de un curso que ya no está elegido", async () => {
        const notasDe5A = [{ nombre: "Ana", promedio: 2.3 }];
        const notasDe6B = [{ nombre: "Beto", promedio: 1.9 }];
        let resolver5A;

        // La consulta del primer curso queda colgada; la del segundo responde ya.
        serviceMock.obtenerNotasBajasProfesor.mockImplementation((_id, params) =>
            params.curso_id === "100"
                ? new Promise((resolve) => {
                      resolver5A = () => resolve(notasDe5A);
                  })
                : Promise.resolve(notasDe6B),
        );
        serviceMock.obtenerNotasAltasProfesor.mockResolvedValue([]);

        const { result } = renderHook(() => useRendimientoProfesor(7, clasesUnicas, cursos));
        await waitFor(() => expect(result.current.cursoFiltro).toBe("100"));

        act(() => result.current.cambiarCurso("200"));
        await waitFor(() => expect(result.current.notasBajas).toEqual(notasDe6B));

        // Ahora llega, tarde, la respuesta del curso anterior.
        await act(async () => {
            resolver5A();
        });

        expect(result.current.notasBajas).toEqual(notasDe6B);
        expect(result.current.cursoFiltro).toBe("200");
        expect(result.current.loadingRendimiento).toBe(false);
    });

    it("descarta el fallo tardío de una consulta ya superada", async () => {
        let rechazar100;
        serviceMock.obtenerNotasBajasProfesor.mockImplementation((_id, params) =>
            params.curso_id === "100"
                ? new Promise((_resolve, reject) => {
                      rechazar100 = () => reject(new Error("500"));
                  })
                : Promise.resolve(notasBajas),
        );

        const { result } = renderHook(() => useRendimientoProfesor(7, clasesUnicas, cursos));
        await waitFor(() => expect(result.current.cursoFiltro).toBe("100"));

        act(() => result.current.cambiarCurso("200"));
        await waitFor(() => expect(result.current.notasBajas).toEqual(notasBajas));

        await act(async () => {
            rechazar100();
        });

        expect(result.current.errorRendimiento).toBe("");
        expect(result.current.notasBajas).toEqual(notasBajas);
    });

    it("limpia el error al volver a consultar con éxito", async () => {
        serviceMock.obtenerNotasBajasProfesor.mockRejectedValueOnce(new Error("500"));

        const { result } = renderHook(() => useRendimientoProfesor(7, clasesUnicas, cursos));
        await waitFor(() => expect(result.current.errorRendimiento).toBeTruthy());

        act(() => result.current.cambiarCurso("200"));

        // Se espera el estado final. El error se limpia al iniciar la consulta,
        // así que esperarlo a él dejaría pasar la prueba antes de tener datos.
        await waitFor(() => expect(result.current.notasBajas).toEqual(notasBajas));
        expect(result.current.errorRendimiento).toBe("");
    });
});
