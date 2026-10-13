import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  guardarValorPersonalizado: vi.fn(),
  obtenerValoresPagoEstudiante: vi.fn(),
  quitarValorPersonalizado: vi.fn(),
}));

vi.mock("../../services/pagosApi", () => ({
  default: {
    guardarValorPersonalizado: mocks.guardarValorPersonalizado,
    obtenerValoresPagoEstudiante: mocks.obtenerValoresPagoEstudiante,
    quitarValorPersonalizado: mocks.quitarValorPersonalizado,
  },
}));

import useValoresPagoMatricula from "./useValoresPagoMatricula";

const PREPARACION = { id: 3, anio: 2027, estado: "preparacion" };
const ANA = { id: 7, nombre: "Ana Rojas" };
const RESPUESTA = {
  estudiante_id: 7,
  anio_lectivo_id: 3,
  curso_id: 20,
  conceptos: [
    {
      tipo_pago_id: 12,
      nombre: "MENSUALIDAD",
      tipo_cobro: "mensual",
      precio_curso: 200000,
      valor_personalizado: 180000,
      motivo: "Beca parcial",
      valor_a_pagar: 180000,
    },
    {
      tipo_pago_id: 13,
      nombre: "MATRICULA",
      tipo_cobro: "anual",
      precio_curso: 300000,
      valor_personalizado: null,
      motivo: null,
      valor_a_pagar: 300000,
    },
  ],
};

function renderizar(opciones = {}) {
  return renderHook(
    ({ anio }) => useValoresPagoMatricula(anio, opciones),
    { initialProps: { anio: PREPARACION } },
  );
}

async function abrirAna(opciones) {
  const hook = renderizar(opciones);
  await act(async () => {
    await hook.result.current.abrir(ANA);
  });
  return hook;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.obtenerValoresPagoEstudiante.mockResolvedValue(RESPUESTA);
  mocks.guardarValorPersonalizado.mockResolvedValue({ message: "Valor personalizado guardado" });
  mocks.quitarValorPersonalizado.mockResolvedValue({ message: "Valor personalizado eliminado" });
});

describe("useValoresPagoMatricula", () => {
  it("pide los valores del año en preparación y deja listos los campos", async () => {
    const { result } = await abrirAna();

    expect(mocks.obtenerValoresPagoEstudiante).toHaveBeenCalledWith(7, {
      parametrosAnio: { anio_lectivo_id: 3 },
    });
    expect(result.current.estudiante).toEqual(ANA);
    expect(result.current.filas.map((fila) => fila.nombre)).toEqual(["MENSUALIDAD", "MATRICULA"]);
    // Con valor personalizado, el campo trae ese valor; sin él, queda vacío.
    expect(result.current.borradores).toEqual({
      12: { valor: "180000", motivo: "Beca parcial" },
      13: { valor: "", motivo: "" },
    });
    expect(result.current.cargando).toBe(false);
  });

  it("descarta la respuesta de un estudiante si mientras tanto se abrió otro", async () => {
    let resolverAna;
    mocks.obtenerValoresPagoEstudiante.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolverAna = resolve;
      }),
    );
    const { result } = renderizar();

    let cargaAna;
    act(() => {
      cargaAna = result.current.abrir(ANA);
    });
    mocks.obtenerValoresPagoEstudiante.mockResolvedValueOnce({ conceptos: [] });
    await act(async () => {
      await result.current.abrir({ id: 8, nombre: "Luis Pardo" });
    });
    await act(async () => {
      resolverAna(RESPUESTA);
      await cargaAna;
    });

    expect(result.current.estudiante).toEqual({ id: 8, nombre: "Luis Pardo" });
    expect(result.current.filas).toEqual([]);
  });

  it("si no se pueden cargar, muestra el mensaje del backend", async () => {
    mocks.obtenerValoresPagoEstudiante.mockRejectedValue({
      response: { data: { detail: "El estudiante no tiene matrícula en el año lectivo seleccionado." } },
    });

    const { result } = await abrirAna();

    expect(result.current.error).toBe(
      "El estudiante no tiene matrícula en el año lectivo seleccionado.",
    );
    expect(result.current.filas).toEqual([]);
    expect(result.current.cargando).toBe(false);
  });

  it("no guarda un valor vacío ni negativo", async () => {
    const { result } = await abrirAna();

    await act(async () => {
      await result.current.guardar(13);
    });
    expect(result.current.error).toBe("Escribe un valor de cero o más para MATRICULA.");

    act(() => result.current.cambiarBorrador(13, "valor", "-5"));
    await act(async () => {
      await result.current.guardar(13);
    });
    expect(result.current.error).toBe("Escribe un valor de cero o más para MATRICULA.");
    expect(mocks.guardarValorPersonalizado).not.toHaveBeenCalled();
  });

  it("guarda con el mismo cuerpo que Pagos, recarga y avisa", async () => {
    const onCambio = vi.fn();
    const { result } = await abrirAna({ onCambio });
    act(() => result.current.cambiarBorrador(13, "valor", "250000"));
    act(() => result.current.cambiarBorrador(13, "motivo", "Acuerdo con la familia"));

    await act(async () => {
      await result.current.guardar(13);
    });

    expect(mocks.guardarValorPersonalizado).toHaveBeenCalledWith(7, 13, {
      valor: 250000,
      motivo: "Acuerdo con la familia",
      activo: true,
    });
    expect(mocks.obtenerValoresPagoEstudiante).toHaveBeenCalledTimes(2);
    expect(result.current.mensaje).toBe("Se guardó el valor de MATRICULA para Ana Rojas.");
    expect(result.current.error).toBe("");
    expect(result.current.guardandoTipoId).toBe(null);
    expect(onCambio).toHaveBeenCalledTimes(1);
  });

  it("si el backend rechaza, muestra su mensaje y no recarga", async () => {
    const onCambio = vi.fn();
    mocks.guardarValorPersonalizado.mockRejectedValue({
      response: { data: { detail: "Este concepto no esta asignado al curso del estudiante." } },
    });
    const { result } = await abrirAna({ onCambio });
    act(() => result.current.cambiarBorrador(13, "valor", "250000"));

    await act(async () => {
      await result.current.guardar(13);
    });

    expect(result.current.error).toBe("Este concepto no esta asignado al curso del estudiante.");
    expect(result.current.mensaje).toBe("");
    expect(mocks.obtenerValoresPagoEstudiante).toHaveBeenCalledTimes(1);
    expect(onCambio).not.toHaveBeenCalled();
    expect(result.current.guardandoTipoId).toBe(null);
  });

  it("si se guardó pero no se pudo recargar, no lo presenta como fallido", async () => {
    const { result } = await abrirAna();
    mocks.obtenerValoresPagoEstudiante.mockRejectedValueOnce(new Error("Sin conexión"));
    act(() => result.current.cambiarBorrador(13, "valor", "250000"));

    await act(async () => {
      await result.current.guardar(13);
    });

    expect(result.current.mensaje).toBe("Se guardó el valor de MATRICULA para Ana Rojas.");
    expect(result.current.error).toBe("El cambio se guardó, pero no se pudo actualizar la lista.");
  });

  it("volver al precio del curso pide confirmación y, si se cancela, no hace nada", async () => {
    const confirmar = vi.fn(() => false);
    const { result } = await abrirAna({ confirmar });

    await act(async () => {
      await result.current.volverAlPrecio(12);
    });

    expect(confirmar).toHaveBeenCalledWith(
      "¿Quitar el valor personalizado de MENSUALIDAD? Ana Rojas volverá a pagar el precio del curso.",
    );
    expect(mocks.quitarValorPersonalizado).not.toHaveBeenCalled();
  });

  it("volver al precio del curso quita el valor, recarga y avisa", async () => {
    const onCambio = vi.fn();
    const { result } = await abrirAna({ onCambio, confirmar: () => true });

    await act(async () => {
      await result.current.volverAlPrecio(12);
    });

    expect(mocks.quitarValorPersonalizado).toHaveBeenCalledWith(7, 12);
    expect(mocks.obtenerValoresPagoEstudiante).toHaveBeenCalledTimes(2);
    expect(result.current.mensaje).toBe(
      "MENSUALIDAD vuelve al precio del curso para Ana Rojas.",
    );
    expect(onCambio).toHaveBeenCalledTimes(1);
  });

  it("cerrar deja el recuadro vacío", async () => {
    const { result } = await abrirAna();

    act(() => result.current.cerrar());

    expect(result.current.estudiante).toBe(null);
    expect(result.current.filas).toEqual([]);
    expect(result.current.mensaje).toBe("");
  });

  it("si ya no hay año en preparación, se cierra solo", async () => {
    const hook = await abrirAna();

    hook.rerender({ anio: null });

    await waitFor(() => expect(hook.result.current.estudiante).toBe(null));
  });
});
