import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerFirmaInstitucionalMock } = vi.hoisted(() => ({
  obtenerFirmaInstitucionalMock: vi.fn(),
}));

vi.mock("../../services/firmasApi", () => ({
  obtenerFirmaInstitucional: obtenerFirmaInstitucionalMock,
}));

import useFirmaParaImprimir from "./useFirmaParaImprimir";

const IMAGEN = "data:image/png;base64,rector";

beforeEach(() => {
  obtenerFirmaInstitucionalMock.mockReset().mockResolvedValue({ imagen: IMAGEN, actualizado_en: "x" });
});

describe("useFirmaParaImprimir", () => {
  it("en la lista de certificados no pide nada", () => {
    const { result } = renderHook(() => useFirmaParaImprimir({ activo: false }));

    expect(obtenerFirmaInstitucionalMock).not.toHaveBeenCalled();
    expect(result.current).toEqual({ imagen: null, cargando: false, error: false });
  });

  it("al abrir un certificado la trae, y abrir otro no la vuelve a pedir", async () => {
    const { result, rerender } = renderHook(({ activo }) => useFirmaParaImprimir({ activo }), {
      initialProps: { activo: true },
    });
    await waitFor(() => expect(result.current.imagen).toBe(IMAGEN));
    expect(result.current.cargando).toBe(false);

    rerender({ activo: false });
    rerender({ activo: true });

    expect(obtenerFirmaInstitucionalMock).toHaveBeenCalledTimes(1);
    expect(result.current.imagen).toBe(IMAGEN);
  });

  it("si se cerró el certificado antes de que llegara, la próxima vez la pide de nuevo", async () => {
    obtenerFirmaInstitucionalMock.mockImplementationOnce(
      ({ signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(Object.assign(new Error("cancelada"), { code: "ERR_CANCELED" })));
        }),
    );
    const { result, rerender } = renderHook(({ activo }) => useFirmaParaImprimir({ activo }), {
      initialProps: { activo: true },
    });

    rerender({ activo: false });
    rerender({ activo: true });

    await waitFor(() => expect(result.current.imagen).toBe(IMAGEN));
    expect(obtenerFirmaInstitucionalMock).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBe(false);
  });

  it("sin firma guardada queda en null; si falla, lo dice", async () => {
    obtenerFirmaInstitucionalMock.mockResolvedValueOnce({ imagen: null, actualizado_en: null });
    const sinFirma = renderHook(() => useFirmaParaImprimir({ activo: true }));
    await waitFor(() => expect(sinFirma.result.current.cargando).toBe(false));
    expect(sinFirma.result.current.imagen).toBeNull();

    obtenerFirmaInstitucionalMock.mockRejectedValueOnce(new Error("sin red"));
    const conFallo = renderHook(() => useFirmaParaImprimir({ activo: true }));
    await waitFor(() => expect(conFallo.result.current.error).toBe(true));
    expect(conFallo.result.current.imagen).toBeNull();
  });
});
