import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useAparecerAlBajar from "./useAparecerAlBajar";

describe("useAparecerAlBajar", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sin IntersectionObserver muestra el contenido de una vez", () => {
        vi.stubGlobal("IntersectionObserver", undefined);

        const { result } = renderHook(() => useAparecerAlBajar());

        expect(result.current[1]).toBe(true);
    });

    it("lo muestra cuando entra en pantalla y deja de observar", () => {
        const observados = [];
        const desconectar = vi.fn();
        let avisar;
        vi.stubGlobal(
            "IntersectionObserver",
            class {
                constructor(callback) {
                    avisar = callback;
                }

                observe(elemento) {
                    observados.push(elemento);
                }

                disconnect() {
                    desconectar();
                }
            },
        );
        const elemento = document.createElement("div");

        const { result } = renderHook(() => {
            const resultado = useAparecerAlBajar();
            // Simula el `ref` puesto en un elemento real antes del efecto.
            resultado[0].current = elemento;
            return resultado;
        });

        expect(result.current[1]).toBe(false);
        expect(observados).toEqual([elemento]);

        act(() => avisar([{ isIntersecting: false }]));
        expect(result.current[1]).toBe(false);

        act(() => avisar([{ isIntersecting: true }]));
        expect(result.current[1]).toBe(true);
        expect(desconectar).toHaveBeenCalled();
    });
});
