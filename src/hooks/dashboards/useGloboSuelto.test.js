import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useGloboSuelto, { puedeSoltarGlobos } from "./useGloboSuelto";

const caja = (left, top, width, height) => ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
});

// El globo de hoy está en el muro, más abajo de lo que se ve (la pantalla
// mide 800 de alto); el muro ocupa el ancho del contenido, de 280 a 1280.
const crearRefs = () => {
    const origen = document.createElement("li");
    origen.getBoundingClientRect = () => caja(600, 1500, 116, 200);
    const area = document.createElement("section");
    area.getBoundingClientRect = () => caja(280, 1300, 1000, 400);
    return {
        globoRef: { current: document.createElement("div") },
        origenRef: { current: origen },
        areaRef: { current: area },
    };
};

const animateOriginal = Element.prototype.animate;
let animaciones;

describe("useGloboSuelto", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        animaciones = [];
        vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
        vi.stubGlobal("CSS", { supports: vi.fn(() => true) });
        vi.stubGlobal("innerWidth", 1280);
        vi.stubGlobal("innerHeight", 800);
        Element.prototype.animate = vi.fn(function animar(fotogramas, opciones) {
            const animacion = { fotogramas, opciones, cancel: vi.fn(), onfinish: null };
            animaciones.push(animacion);
            return animacion;
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        if (animateOriginal) Element.prototype.animate = animateOriginal;
        else delete Element.prototype.animate;
    });

    it("con «reducir movimiento» el globo se queda en el muro", () => {
        vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
        const refs = crearRefs();

        const { result } = renderHook(() => useGloboSuelto({ ...refs, retraso: 1400 }));
        act(() => {
            vi.advanceTimersByTime(5000);
        });

        expect(puedeSoltarGlobos()).toBe(false);
        expect(result.current).toBe(false);
        expect(animaciones).toHaveLength(0);
    });

    it("sin soporte para moverlo por un camino tampoco se suelta", () => {
        vi.stubGlobal("CSS", { supports: vi.fn(() => false) });

        expect(puedeSoltarGlobos()).toBe(false);
    });

    it("espera en el muro y luego se suelta, entrando por el borde de abajo", () => {
        const refs = crearRefs();

        const { result } = renderHook(() => useGloboSuelto({ ...refs, retraso: 1400 }));
        act(() => {
            vi.advanceTimersByTime(1399);
        });
        expect(result.current).toBe(false);

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(result.current).toBe(true);
        expect(animaciones).toHaveLength(1);

        const [soltarse] = animaciones;
        expect(soltarse.fotogramas).toEqual([{ offsetDistance: "0%" }, { offsetDistance: "100%" }]);
        expect(soltarse.opciones).toMatchObject({ duration: 6000, fill: "forwards" });
        // Centro del globo: x = 600 + 58. El muro está más abajo de lo que se
        // ve, así que sale del borde de abajo (800 + 200) y no de 1600.
        expect(refs.globoRef.current.style.offsetPath).toMatch(/^path\('M 658 1000 C 658 /);
        expect(refs.globoRef.current.style.width).toBe("116px");
    });

    it("después de subir pasea sin parar, empezando donde terminó", () => {
        const refs = crearRefs();
        renderHook(() => useGloboSuelto({ ...refs, retraso: 1400 }));
        act(() => {
            vi.advanceTimersByTime(1400);
        });
        const [soltarse] = animaciones;
        const destino = soltarse && refs.globoRef.current.style.offsetPath.match(/ (\d+) (\d+)'\)$/);

        act(() => {
            soltarse.onfinish();
        });

        expect(soltarse.cancel).toHaveBeenCalled();
        expect(animaciones).toHaveLength(2);
        const paseo = animaciones[1];
        expect(paseo.opciones).toMatchObject({ iterations: Infinity, easing: "linear" });
        expect(paseo.opciones.duration).toBeGreaterThanOrEqual(30000);
        expect(paseo.opciones.duration).toBeLessThanOrEqual(120000);
        // El paseo arranca en el punto donde terminó de subir.
        expect(refs.globoRef.current.style.offsetPath).toContain(`path('M ${destino[1]} ${destino[2]} C `);
    });

    it("si cambia el tamaño de la pantalla arma otro paseo, y al salir lo detiene", () => {
        const refs = crearRefs();
        const { unmount } = renderHook(() => useGloboSuelto({ ...refs, retraso: 1400 }));
        act(() => {
            vi.advanceTimersByTime(1400);
        });
        act(() => {
            animaciones[0].onfinish();
        });
        const primerPaseo = animaciones[1];

        act(() => {
            window.dispatchEvent(new Event("resize"));
            vi.advanceTimersByTime(400);
        });

        expect(primerPaseo.cancel).toHaveBeenCalled();
        expect(animaciones).toHaveLength(3);

        unmount();
        expect(animaciones[2].cancel).toHaveBeenCalled();
    });
});
