import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useCargaObservacionVisible from "./useCargaObservacionVisible";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useCargaObservacionVisible", () => {
  it("activa la consulta solo al entrar en el margen visible", () => {
    let callback;
    const observe = vi.fn();
    const disconnect = vi.fn();
    class IntersectionObserverMock {
      constructor(observerCallback) {
        callback = observerCallback;
      }

      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
    }

    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

    const elemento = document.createElement("div");
    const { result } = renderHook(() => useCargaObservacionVisible());
    result.current.elementoRef.current = elemento;

    act(() => result.current.observar());

    expect(result.current.habilitado).toBe(false);
    expect(observe).toHaveBeenCalledWith(elemento);

    act(() => callback([{ isIntersecting: true }]));

    expect(result.current.habilitado).toBe(true);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("habilita inmediatamente cuando IntersectionObserver no está disponible", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { result } = renderHook(() => useCargaObservacionVisible());
    result.current.elementoRef.current = document.createElement("div");

    act(() => result.current.observar());

    expect(result.current.habilitado).toBe(true);
  });
});
