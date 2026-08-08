import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useContextoProfesor from "./useContextoProfesor";

const locationOriginal = window.location;

const clases = [{ id: 10 }, { id: 11 }];

const iniciarSesionProfesor = () => {
    localStorage.setItem("profesor", JSON.stringify({ id: 7, nombre: "ana maría", apellido: "Arias" }));
};

describe("useContextoProfesor", () => {
    beforeEach(() => {
        localStorage.clear();
        delete window.location;
        window.location = { href: "" };
    });

    afterEach(() => {
        window.location = locationOriginal;
    });

    it("redirige a login cuando no hay profesor", () => {
        const { result } = renderHook(() => useContextoProfesor());

        expect(window.location.href).toBe("/login");
        expect(result.current.profesorId).toBeUndefined();
    });

    it("expone el identificador y el saludo del profesor", () => {
        iniciarSesionProfesor();

        const { result } = renderHook(() => useContextoProfesor());

        expect(window.location.href).toBe("");
        expect(result.current.profesorId).toBe(7);
        expect(result.current.nombreProfesor).toBe("Ana");
    });

    it("arranca con el contexto guardado en el almacenamiento", () => {
        iniciarSesionProfesor();
        localStorage.setItem("asignacionId", "10");
        localStorage.setItem("periodo_profesor_7", "3");
        localStorage.setItem("fechaAsistencia", "2026-08-07");

        const { result } = renderHook(() => useContextoProfesor());

        expect(result.current.asignacionId).toBe("10");
        expect(result.current.periodo).toBe("3");
        expect(result.current.fecha).toBe("2026-08-07");
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

        act(() => result.current.cambiarFecha("2026-08-08"));
        expect(result.current.fecha).toBe("2026-08-08");
        expect(localStorage.getItem("fechaAsistencia")).toBe("2026-08-08");
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

    it("exige una clase elegida antes de abrir un ranking", () => {
        iniciarSesionProfesor();
        window.alert = vi.fn();

        const { result } = renderHook(() => useContextoProfesor());

        expect(result.current.exigirClaseElegida()).toBe(false);
        expect(window.alert).toHaveBeenCalledWith(
            "Por favor, selecciona un salón (materia) primero para ver el ranking.",
        );

        act(() => result.current.cambiarAsignacion("10"));
        window.alert.mockClear();

        expect(result.current.exigirClaseElegida()).toBe(true);
        expect(window.alert).not.toHaveBeenCalled();
    });

    it("no hace nada cuando no hay clase guardada", () => {
        iniciarSesionProfesor();

        const { result } = renderHook(() => useContextoProfesor());

        act(() => result.current.descartarAsignacionInvalida([]));

        expect(result.current.asignacionId).toBe("");
        expect(localStorage.getItem("asignacionId")).toBeNull();
    });
});
