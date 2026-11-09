import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useContextoProfesor from "./useContextoProfesor";

const { swalFireMock } = vi.hoisted(() => ({ swalFireMock: vi.fn() }));

vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

const clases = [{ id: 10 }, { id: 11 }];

const iniciarSesionProfesor = () => {
    localStorage.setItem("profesor", JSON.stringify({ id: 7, nombre: "ana maría", apellido: "Arias" }));
};

describe("useContextoProfesor", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("informa que no hay sesión para que la página redirija", () => {
        const { result } = renderHook(() => useContextoProfesor());

        expect(result.current.sesionInvalida).toBe(true);
        expect(result.current.profesorId).toBeUndefined();
    });

    it("expone el identificador y el saludo del profesor", () => {
        iniciarSesionProfesor();

        const { result } = renderHook(() => useContextoProfesor());

        expect(result.current.sesionInvalida).toBe(false);
        expect(result.current.profesorId).toBe(7);
        expect(result.current.nombreProfesor).toBe("Ana");
    });

    it("arranca con el contexto guardado en el almacenamiento", () => {
        iniciarSesionProfesor();
        localStorage.setItem("asignacionId", "10");
        localStorage.setItem("periodo_profesor_7", "3");

        const { result } = renderHook(() => useContextoProfesor());

        expect(result.current.asignacionId).toBe("10");
        expect(result.current.periodo).toBe("3");
        // La fecha ya no es parte del contexto del panel.
        expect(result.current).not.toHaveProperty("fecha");
    });

    it("usa el período de respaldo cuando no hay uno guardado", () => {
        iniciarSesionProfesor();

        const { result } = renderHook(() => useContextoProfesor());

        expect(result.current.periodo).toBe("1");
    });

    it("persiste cada cambio del contexto de trabajo", () => {
        iniciarSesionProfesor();

        const { result } = renderHook(() => useContextoProfesor());

        act(() => result.current.cambiarAsignacion("11"));
        expect(result.current.asignacionId).toBe("11");
        expect(localStorage.getItem("asignacionId")).toBe("11");

        act(() => result.current.cambiarPeriodo("4"));
        expect(result.current.periodo).toBe("4");
        expect(localStorage.getItem("periodo")).toBe("4");
        expect(localStorage.getItem("periodo_profesor_7")).toBe("4");
    });

    it("descarta la clase guardada que ya no está asignada", () => {
        iniciarSesionProfesor();
        localStorage.setItem("asignacionId", "999");

        const { result } = renderHook(() => useContextoProfesor());

        act(() => result.current.descartarAsignacionInvalida(clases));

        expect(result.current.asignacionId).toBe("");
        expect(localStorage.getItem("asignacionId")).toBeNull();
    });

    it("conserva la clase guardada que sigue asignada", () => {
        iniciarSesionProfesor();
        localStorage.setItem("asignacionId", "10");

        const { result } = renderHook(() => useContextoProfesor());

        act(() => result.current.descartarAsignacionInvalida(clases));

        expect(result.current.asignacionId).toBe("10");
        expect(localStorage.getItem("asignacionId")).toBe("10");
    });

    it("no hace nada cuando no hay clase guardada", () => {
        iniciarSesionProfesor();

        const { result } = renderHook(() => useContextoProfesor());

        act(() => result.current.descartarAsignacionInvalida([]));

        expect(result.current.asignacionId).toBe("");
        expect(localStorage.getItem("asignacionId")).toBeNull();
    });
});
