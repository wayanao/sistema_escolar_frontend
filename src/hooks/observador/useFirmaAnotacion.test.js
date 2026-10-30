import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  firmarAnotacionMock,
  firmarAnotacionesDelPeriodoMock,
  obtenerFirmantesSugeridosMock,
} = vi.hoisted(() => ({
  firmarAnotacionMock: vi.fn(),
  firmarAnotacionesDelPeriodoMock: vi.fn(),
  obtenerFirmantesSugeridosMock: vi.fn(),
}));

vi.mock("../../services/observadorApi", () => ({
  firmarAnotacion: firmarAnotacionMock,
  firmarAnotacionesDelPeriodo: firmarAnotacionesDelPeriodoMock,
  obtenerFirmantesSugeridos: obtenerFirmantesSugeridosMock,
}));

import useFirmaAnotacion from "./useFirmaAnotacion";
import { MENSAJE_FIRMA_FALLO } from "../../utils/observador/firma";

const PRIMERA = { id: 12, version: "v12", puede_firmar: true, firma: null };
const SEGUNDA = { id: 13, version: "v13", puede_firmar: true, firma: null };
const MADRE = {
  parentesco: "Madre",
  nombre: "Maria Lopez",
  tipo_documento: "Cédula",
  documento: "52123456",
};
const RESPUESTA = {
  id: 99,
  anotacion_id: 12,
  firmante_nombre: "Maria Lopez",
  firmante_parentesco: "Madre",
  integra: true,
};

function montar(props = {}) {
  const onFirmada = vi.fn();
  const resultado = renderHook((p) => useFirmaAnotacion(p), {
    initialProps: { estudianteId: 11, anotaciones: [PRIMERA, SEGUNDA], onFirmada, ...props },
  });
  return { ...resultado, onFirmada };
}

/** Abre la primera, elige a la madre, firma y marca la casilla. */
async function completar(result) {
  act(() => result.current.abrir(PRIMERA));
  await waitFor(() => expect(result.current.sugeridos).toHaveLength(1));
  act(() => {
    result.current.elegirSugerido(MADRE);
    result.current.cambiarImagen("data:image/png;base64,AAAA");
    result.current.cambiarLeida(true);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  obtenerFirmantesSugeridosMock.mockResolvedValue([MADRE]);
  firmarAnotacionMock.mockResolvedValue(RESPUESTA);
});

describe("la ventana de firma", () => {
  it("cerrada no pide nada al servidor", () => {
    const { result } = montar();

    expect(result.current.anotacion).toBeNull();
    expect(obtenerFirmantesSugeridosMock).not.toHaveBeenCalled();
  });

  it("al abrir pide los acudientes de la ficha, y elegir uno llena el formulario", async () => {
    const { result } = montar();

    act(() => result.current.abrir(PRIMERA));
    await waitFor(() => expect(result.current.sugeridos).toStrictEqual([MADRE]));
    expect(obtenerFirmantesSugeridosMock).toHaveBeenCalledWith(11, {
      signal: expect.any(AbortSignal),
    });

    act(() => result.current.elegirSugerido(MADRE));
    expect(result.current.firmante).toStrictEqual({
      nombre: "Maria Lopez",
      tipoDocumento: "Cédula",
      documento: "52123456",
      parentesco: "Madre",
    });
  });

  it("no guarda mientras falte algo", async () => {
    const { result } = montar();
    act(() => result.current.abrir(PRIMERA));

    expect(result.current.falta).toBe("Escribe el nombre de quien firma.");
    await act(() => result.current.guardar());
    expect(firmarAnotacionMock).not.toHaveBeenCalled();
  });

  it("guarda con la versión que trajo la bitácora y avisa para recargarla", async () => {
    const { result, onFirmada } = montar();
    await completar(result);
    expect(result.current.falta).toBeNull();

    await act(() => result.current.guardar());

    expect(firmarAnotacionMock).toHaveBeenCalledWith(12, {
      firmante_nombre: "Maria Lopez",
      firmante_tipo_documento: "Cédula",
      firmante_documento: "52123456",
      firmante_parentesco: "Madre",
      imagen: "data:image/png;base64,AAAA",
      version: "v12",
    });
    expect(result.current.firmada).toBe(RESPUESTA);
    expect(onFirmada).toHaveBeenCalledTimes(1);
    expect(result.current.propsVentana.haySiguiente).toBe(true);
  });

  it("«Firmar la siguiente» conserva a quien firma, pero la firma se dibuja otra vez", async () => {
    const { result } = montar();
    await completar(result);
    await act(() => result.current.guardar());

    act(() => result.current.firmarSiguiente());

    expect(result.current.anotacion).toBe(SEGUNDA);
    expect(result.current.firmante.nombre).toBe("Maria Lopez");
    expect(result.current.imagen).toBeNull();
    expect(result.current.leida).toBe(false);
    expect(result.current.firmada).toBeNull();
    // Los acudientes ya estaban: no se vuelven a pedir.
    expect(obtenerFirmantesSugeridosMock).toHaveBeenCalledTimes(1);
  });

  it("un 409 enseña el mensaje del servidor y pide recargar la bitácora", async () => {
    firmarAnotacionMock.mockRejectedValue({
      response: { status: 409, data: { detail: "Esta anotacion ya tiene la firma del acudiente." } },
    });
    const { result, onFirmada } = montar();
    await completar(result);

    await act(() => result.current.guardar());

    expect(result.current.error).toBe("Esta anotacion ya tiene la firma del acudiente.");
    expect(result.current.firmada).toBeNull();
    expect(onFirmada).toHaveBeenCalledTimes(1);
  });

  it("un fallo de red no pierde el trazo: se reintenta sin firmar de nuevo", async () => {
    firmarAnotacionMock.mockRejectedValueOnce(new Error("Network Error"));
    const { result, onFirmada } = montar();
    await completar(result);

    await act(() => result.current.guardar());

    expect(result.current.error).toBe(MENSAJE_FIRMA_FALLO);
    expect(result.current.imagen).toBe("data:image/png;base64,AAAA");
    expect(onFirmada).not.toHaveBeenCalled();

    await act(() => result.current.guardar());
    expect(result.current.firmada).toBe(RESPUESTA);
    expect(result.current.error).toBeNull();
  });

  it("al cerrar se olvida todo, también quién firmaba", async () => {
    const { result } = montar();
    await completar(result);

    act(() => result.current.cerrar());

    expect(result.current.anotacion).toBeNull();
    expect(result.current.firmante.nombre).toBe("");
    expect(result.current.imagen).toBeNull();
  });

  it("si la ficha no se puede leer, la ventana se llena a mano", async () => {
    obtenerFirmantesSugeridosMock.mockRejectedValue({ response: { status: 403 } });
    const { result } = montar();

    act(() => result.current.abrir(PRIMERA));

    await waitFor(() => expect(result.current.cargandoSugeridos).toBe(false));
    expect(result.current.sugeridos).toStrictEqual([]);
  });

  it("vuelve a pedir los acudientes al cambiar de estudiante", async () => {
    const { result, rerender, onFirmada } = montar();
    act(() => result.current.abrir(PRIMERA));
    await waitFor(() => expect(result.current.sugeridos).toHaveLength(1));

    rerender({ estudianteId: 22, anotaciones: [PRIMERA], onFirmada });

    await waitFor(() => expect(obtenerFirmantesSugeridosMock).toHaveBeenCalledTimes(2));
    expect(obtenerFirmantesSugeridosMock).toHaveBeenLastCalledWith(22, {
      signal: expect.any(AbortSignal),
    });
  });
});

describe("firmar un periodo de una vez", () => {
  const P1_A = { id: 21, periodo: 1, version: "v21", puede_firmar: true, firma: null };
  const P1_B = { id: 22, periodo: 1, version: "v22", puede_firmar: true, firma: null };
  const P2 = { id: 23, periodo: 2, version: "v23", puede_firmar: true, firma: null };
  const AJENA = { id: 24, periodo: 1, version: "v24", puede_firmar: false, firma: null };
  const BITACORA = [P1_A, AJENA, P1_B, P2];

  async function completarPeriodo(result) {
    act(() => result.current.abrirPeriodo(1));
    await waitFor(() => expect(result.current.sugeridos).toHaveLength(1));
    act(() => {
      result.current.elegirSugerido(MADRE);
      result.current.cambiarImagen("data:image/png;base64,AAAA");
      result.current.cambiarLeida(true);
    });
  }

  it("congela las pendientes del periodo al abrir y ofrece los demás periodos", () => {
    const { result } = montar({ anotaciones: BITACORA });

    act(() => result.current.abrirPeriodo(1));

    expect(result.current.abierta).toBe(true);
    expect(result.current.propsVentana.anotaciones).toStrictEqual([P1_A, P1_B]);
    expect(result.current.propsVentana.periodo).toBe(1);
    expect(result.current.propsVentana.periodos).toStrictEqual([
      { periodo: 1, cantidad: 2 },
      { periodo: 2, cantidad: 1 },
    ]);
  });

  it("guarda una sola firma para todas, con la lista exacta que se mostró", async () => {
    firmarAnotacionesDelPeriodoMock.mockResolvedValue([
      { id: 99, anotacion_id: 21 },
      { id: 100, anotacion_id: 22 },
    ]);
    const { result, onFirmada } = montar({ anotaciones: BITACORA });
    await completarPeriodo(result);

    await act(() => result.current.guardar());

    expect(firmarAnotacionesDelPeriodoMock).toHaveBeenCalledWith(11, {
      firmante_nombre: "Maria Lopez",
      firmante_tipo_documento: "Cédula",
      firmante_documento: "52123456",
      firmante_parentesco: "Madre",
      imagen: "data:image/png;base64,AAAA",
      anotaciones: [{ id: 21, version: "v21" }, { id: 22, version: "v22" }],
    });
    expect(firmarAnotacionMock).not.toHaveBeenCalled();
    expect(result.current.firmada).toHaveLength(2);
    expect(result.current.propsVentana.haySiguiente).toBe(false);
    expect(onFirmada).toHaveBeenCalledTimes(1);
  });

  it("la lista no cambia si la bitácora se recarga mientras el acudiente lee", () => {
    const { result, rerender, onFirmada } = montar({ anotaciones: BITACORA });
    act(() => result.current.abrirPeriodo(1));

    const nueva = { id: 25, periodo: 1, version: "v25", puede_firmar: true, firma: null };
    rerender({ estudianteId: 11, anotaciones: [...BITACORA, nueva], onFirmada });

    expect(result.current.propsVentana.anotaciones).toStrictEqual([P1_A, P1_B]);
  });

  it("cambiar de periodo borra el trazo y la casilla, pero no a quien firma", async () => {
    const { result } = montar({ anotaciones: BITACORA });
    await completarPeriodo(result);

    act(() => result.current.cambiarPeriodo(2));

    expect(result.current.propsVentana.anotaciones).toStrictEqual([P2]);
    expect(result.current.imagen).toBeNull();
    expect(result.current.leida).toBe(false);
    expect(result.current.firmante.nombre).toBe("Maria Lopez");
  });

  it("un periodo sin nada por firmar no deja guardar", () => {
    const { result } = montar({ anotaciones: BITACORA });

    act(() => result.current.abrirPeriodo(4));

    expect(result.current.falta).toBe("No queda nada por firmar en este periodo.");
  });
});
