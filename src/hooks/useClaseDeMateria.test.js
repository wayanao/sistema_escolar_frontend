import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

import useClaseDeMateria from "./useClaseDeMateria";

const CLASES = [
    { id: 10, materia: "MATEMÁTICAS", curso: "5A" },
    { id: 21, materia: "ASISTENCIA DIARIA", curso: "Transición A", nivel: "preescolar" },
];

const TEXTOS = {
    sinOpciones: { titulo: "Sin clases", texto: "" },
    elegir: { titulo: "Elige la clase", texto: "" },
};

function diferido() {
    let resolve;
    const promise = new Promise((resolver) => {
        resolve = resolver;
    });
    return { promise, resolve };
}

beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("profesor", JSON.stringify({ id: 7 }));
});

describe("useClaseDeMateria", () => {
    it("mientras llega la lista usa la clase guardada, sin esperarla", async () => {
        localStorage.setItem("asignacionId", "10");
        const lista = diferido();
        const listarClases = vi.fn(() => lista.promise);

        const { result } = renderHook(() => useClaseDeMateria({ profesorId: 7, listarClases, textos: TEXTOS }));

        expect(result.current.asignacionEfectiva).toBe("10");
        expect(result.current.sinClase).toBeNull();

        lista.resolve(CLASES);
        await waitFor(() => expect(result.current.claseSeleccionada).toEqual(CLASES[0]));
        expect(result.current.asignacionEfectiva).toBe("10");
    });

    it("no ofrece «Asistencia diaria» y, si era la guardada, pide elegir sin borrarla", async () => {
        localStorage.setItem("asignacionId", "21");
        const listarClases = vi.fn().mockResolvedValue(CLASES);

        const { result } = renderHook(() => useClaseDeMateria({ profesorId: 7, listarClases, textos: TEXTOS }));

        await waitFor(() => expect(result.current.cargandoClases).toBe(false));
        expect(result.current.opciones).toEqual([{ valor: "10", etiqueta: "MATEMÁTICAS - 5A" }]);
        expect(result.current.asignacionEfectiva).toBe("");
        expect(result.current.sinClase).toBe(TEXTOS.elegir);
        expect(localStorage.getItem("asignacionId")).toBe("21");
    });

    it("sin clases de materia usa el texto propio de la pantalla", async () => {
        const listarClases = vi.fn().mockResolvedValue([CLASES[1]]);

        const { result } = renderHook(() => useClaseDeMateria({ profesorId: 7, listarClases, textos: TEXTOS }));

        await waitFor(() => expect(result.current.cargandoClases).toBe(false));
        expect(result.current.sinClase).toBe(TEXTOS.sinOpciones);
    });
});
