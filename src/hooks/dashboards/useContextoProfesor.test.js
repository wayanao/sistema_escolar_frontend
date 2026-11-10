import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import useContextoProfesor from "./useContextoProfesor";

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

    it("muestra el último período elegido, sin elegir clase ni tocar lo guardado", () => {
        iniciarSesionProfesor();
        localStorage.setItem("asignacionId", "999");
        localStorage.setItem("periodo_profesor_7", "4");

        const { result } = renderHook(() => useContextoProfesor());

        expect(Object.keys(result.current).sort()).toEqual([
            "nombreProfesor",
            "periodo",
            "profesorId",
            "sesionInvalida",
        ]);
        expect(result.current.periodo).toBe("4");
        expect(localStorage.getItem("asignacionId")).toBe("999");
    });
});
