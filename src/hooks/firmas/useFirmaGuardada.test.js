import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock, sweet } = vi.hoisted(() => ({
  apiMock: {
    obtenerFirmaInstitucional: vi.fn(),
    guardarFirmaInstitucional: vi.fn(),
    quitarFirmaInstitucional: vi.fn(),
    obtenerMiFirma: vi.fn(),
    guardarMiFirma: vi.fn(),
    quitarMiFirma: vi.fn(),
  },
  sweet: {
    fire: vi.fn(),
    update: vi.fn(),
    getFooter: vi.fn(),
    getPopup: vi.fn(),
    isVisible: vi.fn(),
    close: vi.fn(),
  },
}));

vi.mock("../../services/firmasApi", () => apiMock);
// La pregunta de quitar y la tarjeta de espera y éxito (ventanaExito.js).
vi.mock("sweetalert2", () => ({ default: sweet }));

import { opcionesExitoTrasEspera, opcionesVentanaEspera } from "../ventanaExito";
import useFirmaGuardada from "./useFirmaGuardada";

const IMAGEN = "data:image/png;base64,firma";
const GUARDADA = { imagen: IMAGEN, actualizado_en: "2026-11-12T15:30:00+00:00" };
const VACIA = { imagen: null, actualizado_en: null };

beforeEach(() => {
  Object.values(apiMock).forEach((simulada) => simulada.mockReset());
  Object.values(sweet).forEach((simulada) => simulada.mockReset());
  apiMock.obtenerFirmaInstitucional.mockResolvedValue(GUARDADA);
  apiMock.obtenerMiFirma.mockResolvedValue(VACIA);
  apiMock.guardarFirmaInstitucional.mockResolvedValue(GUARDADA);
  apiMock.guardarMiFirma.mockResolvedValue(GUARDADA);
  apiMock.quitarFirmaInstitucional.mockResolvedValue(VACIA);
  sweet.fire.mockResolvedValue({ isConfirmed: true });
});

async function montar(titular) {
  const hook = renderHook(() => useFirmaGuardada(titular));
  await waitFor(() => expect(hook.result.current.cargando).toBe(false));
  return hook;
}

describe("useFirmaGuardada", () => {
  it("carga la firma del rector(a) en la pantalla del admin", async () => {
    const { result } = await montar("institucional");

    expect(apiMock.obtenerFirmaInstitucional).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });
    expect(apiMock.obtenerMiFirma).not.toHaveBeenCalled();
    expect(result.current.firma).toEqual(GUARDADA);
  });

  it("la del profesor sale de /firmas/mia; sin firma, queda en null", async () => {
    const { result } = await montar("mia");

    expect(apiMock.obtenerMiFirma).toHaveBeenCalled();
    expect(apiMock.obtenerFirmaInstitucional).not.toHaveBeenCalled();
    expect(result.current.firma).toBeNull();
  });

  it("si no carga, lo dice", async () => {
    apiMock.obtenerFirmaInstitucional.mockRejectedValue(new Error("sin red"));

    const { result } = await montar("institucional");

    expect(result.current.mensajeError).toBe("No se pudo cargar la firma guardada.");
  });

  it("al salir de la pantalla cancela la carga sin mostrar error", async () => {
    apiMock.obtenerFirmaInstitucional.mockImplementation(
      ({ signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(Object.assign(new Error("cancelada"), { code: "ERR_CANCELED" })));
        }),
    );
    const { result, unmount } = renderHook(() => useFirmaGuardada("institucional"));
    const [{ signal }] = apiMock.obtenerFirmaInstitucional.mock.calls[0];

    unmount();

    expect(signal.aborted).toBe(true);
    expect(result.current.mensajeError).toBe("");
  });

  it("guarda con una sola espera que pasa a éxito", async () => {
    apiMock.obtenerFirmaInstitucional.mockResolvedValue(VACIA);
    const { result } = await montar("institucional");

    let resultado;
    await act(async () => {
      resultado = await result.current.guardar(IMAGEN);
    });

    expect(resultado).toEqual({ estado: "exito" });
    expect(apiMock.guardarFirmaInstitucional).toHaveBeenCalledWith(IMAGEN);
    expect(result.current.firma).toEqual(GUARDADA);
    expect(sweet.fire).toHaveBeenCalledWith(opcionesVentanaEspera({ title: "Guardando la firma…" }));
    expect(sweet.update).toHaveBeenCalledWith(opcionesExitoTrasEspera({ title: "Firma guardada" }));
  });

  it("si el servidor rechaza la imagen, quita la espera y muestra su mensaje", async () => {
    sweet.getPopup.mockReturnValue({ la: "tarjeta" });
    sweet.isVisible.mockReturnValue(true);
    apiMock.guardarMiFirma.mockRejectedValue({
      response: {
        status: 422,
        data: { detail: [{ msg: "Value error, La firma no es una imagen válida. Vuelve a firmar o sube otra foto." }] },
      },
    });
    const { result } = await montar("mia");

    let resultado;
    await act(async () => {
      resultado = await result.current.guardar(IMAGEN);
    });

    expect(resultado.estado).toBe("error");
    expect(sweet.close).toHaveBeenCalled();
    expect(result.current.mensajeError).toBe(
      "La firma no es una imagen válida. Vuelve a firmar o sube otra foto.",
    );
    expect(result.current.firma).toBeNull();
  });

  it("sin imagen no llama al servidor", async () => {
    const { result } = await montar("institucional");

    let resultado;
    await act(async () => {
      resultado = await result.current.guardar(null);
    });

    expect(resultado).toEqual({ estado: "sin-imagen" });
    expect(apiMock.guardarFirmaInstitucional).not.toHaveBeenCalled();
  });

  it("quitar pregunta antes y, si dice que sí, la borra", async () => {
    const { result } = await montar("institucional");

    let resultado;
    await act(async () => {
      resultado = await result.current.quitar();
    });

    expect(sweet.fire.mock.calls[0][0]).toMatchObject({
      title: "¿Quitar la firma?",
      showCancelButton: true,
    });
    expect(resultado).toEqual({ estado: "exito" });
    expect(apiMock.quitarFirmaInstitucional).toHaveBeenCalled();
    expect(result.current.firma).toBeNull();
  });

  it("si en la pregunta dice que no, no toca nada", async () => {
    sweet.fire.mockResolvedValue({ isConfirmed: false });
    const { result } = await montar("institucional");

    let resultado;
    await act(async () => {
      resultado = await result.current.quitar();
    });

    expect(resultado).toEqual({ estado: "cancelado" });
    expect(apiMock.quitarFirmaInstitucional).not.toHaveBeenCalled();
    expect(result.current.firma).toEqual(GUARDADA);
  });
});
