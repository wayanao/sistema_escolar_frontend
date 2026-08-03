import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useAsignacionCursosTipoPago from "./useAsignacionCursosTipoPago";

const { actualizarCursosMock, swalFireMock } = vi.hoisted(() => ({
    actualizarCursosMock: vi.fn(),
    swalFireMock: vi.fn(),
}));

vi.mock("../../services/carteraTiposPagoApi", () => ({
    actualizarCursosTipoPago: actualizarCursosMock,
}));
vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

const cursos = [
    { id: 10, nombre: "5A", estado: "activo" },
    { id: 20, nombre: "6B", estado: "activo" },
    { id: 30, nombre: "7A", estado: "inactivo" },
];

const detalle = { id: 1, valor: 350000 };
const detalleConCursos = {
    ...detalle,
    cursos: [{ curso_id: 10, curso_nombre: "5A", valor: 350000, activo: true }],
};

describe("useAsignacionCursosTipoPago", () => {
    const cargarTiposPagos = vi.fn();

    beforeEach(() => {
        actualizarCursosMock.mockResolvedValue({ actualizados: 1 });
        swalFireMock.mockResolvedValue({ isConfirmed: true });
        cargarTiposPagos.mockReset();
    });

    it("inicializa y transforma localmente las asignaciones", () => {
        const { result } = renderHook(() =>
            useAsignacionCursosTipoPago({
                selectedTipoId: 1,
                detalle,
                cursos,
                cargarTiposPagos,
            })
        );

        act(() => result.current.inicializarAsignacion(detalleConCursos));
        expect(result.current.cursosDisponibles).toEqual(cursos.slice(1));
        expect(result.current.cursosAsignadosDirty).toBe(false);

        act(() => {
            result.current.setCursoAAgregar("20");
            result.current.setValorCursoAAgregar("420000");
        });
        act(() => result.current.agregarCursoLocal());
        expect(result.current.cursosAsignados[1]).toEqual({
            curso_id: 20,
            curso_nombre: "6B",
            valor: 420000,
            activo: true,
        });
        expect(result.current.cursosAsignadosDirty).toBe(true);

        act(() => result.current.agregarTodosLosCursos());
        expect(result.current.cursosAsignados[2].curso_id).toBe(30);
    });

    it("guarda el reemplazo completo de cursos y recarga conceptos", async () => {
        const { result } = renderHook(() =>
            useAsignacionCursosTipoPago({
                selectedTipoId: 1,
                detalle,
                cursos,
                cargarTiposPagos,
            })
        );
        act(() => result.current.inicializarAsignacion(detalleConCursos));
        act(() => result.current.actualizarValorCurso(10, "400000"));

        await act(async () => result.current.guardarAsignacionCursos());

        expect(actualizarCursosMock).toHaveBeenCalledWith(1, {
            cursos: [{ curso_id: 10, valor: 400000, activo: true }],
        });
        expect(swalFireMock).toHaveBeenCalledWith(
            "Guardado",
            "Cursos asignados correctamente",
            "success"
        );
        expect(cargarTiposPagos).toHaveBeenCalledTimes(1);
        expect(result.current.cursosAsignadosDirty).toBe(false);
        expect(result.current.guardandoCursos).toBe(false);
    });

    it("conserva los cambios pendientes cuando falla el guardado", async () => {
        const error = { response: { data: { detail: "No se pudo asignar" } } };
        actualizarCursosMock.mockRejectedValue(error);
        vi.spyOn(console, "error").mockImplementation(() => {});
        const { result } = renderHook(() =>
            useAsignacionCursosTipoPago({
                selectedTipoId: 1,
                detalle,
                cursos,
                cargarTiposPagos,
            })
        );
        act(() => result.current.inicializarAsignacion(detalleConCursos));
        act(() => result.current.toggleActivoCurso(10));

        await act(async () => result.current.guardarAsignacionCursos());

        expect(swalFireMock).toHaveBeenCalledWith("Error", "No se pudo asignar", "error");
        expect(result.current.cursosAsignadosDirty).toBe(true);
        expect(result.current.guardandoCursos).toBe(false);
    });
});
