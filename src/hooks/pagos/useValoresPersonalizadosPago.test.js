import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import pagosApi from "../../services/pagosApi";
import useValoresPersonalizadosPago from "./useValoresPersonalizadosPago";

vi.mock("../../services/pagosApi", () => ({
  default: {
    obtenerValoresPagoEstudiante: vi.fn(),
    guardarValorPersonalizado: vi.fn(),
    quitarValorPersonalizado: vi.fn(),
  },
}));

vi.mock("sweetalert2", () => ({
  default: { fire: vi.fn() },
}));

const RESPUESTA = {
  conceptos: [
    {
      tipo_pago_id: 11,
      nombre: "MENSUALIDAD",
      tipo_cobro: "mensual",
      precio_curso: 200000,
      valor_personalizado: 180000,
      motivo: "Beca parcial",
      valor_a_pagar: 180000,
    },
    {
      tipo_pago_id: 12,
      nombre: "MATRICULA",
      tipo_cobro: "anual",
      precio_curso: 300000,
      valor_personalizado: null,
      motivo: null,
      valor_a_pagar: 300000,
    },
  ],
};

function crearProps(sobrescrituras = {}) {
  return {
    selectedEstudiante: { id: 7, nombre: "Ana" },
    parametrosAnio: {},
    actualizarValoresPersonalizados: vi.fn(),
    cargarDeudasEstudiante: vi.fn(),
    cargarOpcionesVencidas: vi.fn(),
    cargarOpcionesAdelanto: vi.fn(),
    ...sobrescrituras,
  };
}

async function abrir(result) {
  await act(async () => result.current.abrirValoresPago());
}

describe("useValoresPersonalizadosPago", () => {
  beforeEach(() => {
    pagosApi.obtenerValoresPagoEstudiante.mockReset();
    pagosApi.guardarValorPersonalizado.mockReset();
    pagosApi.quitarValorPersonalizado.mockReset();
    Swal.fire.mockReset();
    pagosApi.obtenerValoresPagoEstudiante.mockResolvedValue(RESPUESTA);
  });

  it("al abrir pide los conceptos del año del pago y arma los campos", async () => {
    const { result } = renderHook(() => useValoresPersonalizadosPago(crearProps()));

    await abrir(result);

    expect(pagosApi.obtenerValoresPagoEstudiante).toHaveBeenCalledWith(7);
    expect(result.current.filasValoresPago.map((fila) => fila.nombre)).toEqual([
      "MENSUALIDAD",
      "MATRICULA",
    ]);
    expect(result.current.borradoresValoresPago).toEqual({
      11: { valor: "180000", motivo: "Beca parcial" },
      12: { valor: "", motivo: "" },
    });
    expect(result.current.cargandoValoresPago).toBe(false);
  });

  it("en otro año pide los conceptos de ese año", async () => {
    const parametrosAnio = { anio_lectivo_id: 2 };
    const { result } = renderHook(() =>
      useValoresPersonalizadosPago(crearProps({ parametrosAnio }))
    );

    await abrir(result);

    expect(pagosApi.obtenerValoresPagoEstudiante).toHaveBeenCalledWith(7, { parametrosAnio });
  });

  it("avisa con el mensaje del backend si no puede cargarlos", async () => {
    pagosApi.obtenerValoresPagoEstudiante.mockRejectedValue({
      response: { data: { detail: "El estudiante no tiene matrícula en 2027." } },
    });
    const { result } = renderHook(() => useValoresPersonalizadosPago(crearProps()));

    await abrir(result);

    expect(result.current.errorValoresPago).toBe("El estudiante no tiene matrícula en 2027.");
    expect(result.current.filasValoresPago).toEqual([]);
  });

  it("no guarda un valor vacío", async () => {
    const { result } = renderHook(() => useValoresPersonalizadosPago(crearProps()));
    await abrir(result);

    await act(async () => result.current.guardarValorPago(12));

    expect(pagosApi.guardarValorPersonalizado).not.toHaveBeenCalled();
    expect(result.current.errorValoresPago).toBe(
      "Escribe un valor de cero o más para MATRICULA."
    );
  });

  it("guarda con la ruta de siempre y actualiza el conteo, lo que debe y la lista", async () => {
    const props = crearProps();
    pagosApi.guardarValorPersonalizado.mockResolvedValue({ valores: [{ id: 1 }] });
    const { result } = renderHook(() => useValoresPersonalizadosPago(props));
    await abrir(result);
    act(() => result.current.cambiarBorradorValorPago(12, "valor", "250000"));
    act(() => result.current.cambiarBorradorValorPago(12, "motivo", "Acuerdo"));

    await act(async () => result.current.guardarValorPago(12));

    expect(pagosApi.guardarValorPersonalizado).toHaveBeenCalledWith(7, 12, {
      valor: 250000,
      motivo: "Acuerdo",
      activo: true,
    });
    expect(props.actualizarValoresPersonalizados).toHaveBeenCalledWith([{ id: 1 }]);
    expect(props.cargarDeudasEstudiante).toHaveBeenCalledWith(7);
    expect(props.cargarOpcionesVencidas).toHaveBeenCalledWith(7);
    expect(props.cargarOpcionesAdelanto).toHaveBeenCalledWith(7);
    expect(pagosApi.obtenerValoresPagoEstudiante).toHaveBeenCalledTimes(2);
    expect(result.current.mensajeValoresPago).toBe("Se guardó el valor de MATRICULA para Ana.");
    expect(result.current.guardandoTipoId).toBe(null);
  });

  it("volver al precio pide confirmación y quita con la ruta de siempre", async () => {
    const props = crearProps();
    Swal.fire.mockResolvedValueOnce({ isConfirmed: true });
    pagosApi.quitarValorPersonalizado.mockResolvedValue({});
    const { result } = renderHook(() => useValoresPersonalizadosPago(props));
    await abrir(result);

    await act(async () => result.current.volverAlPrecio(11));

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "¿Volver al precio del curso?",
        text: "Ana volverá a pagar el precio del curso en MENSUALIDAD.",
      })
    );
    expect(pagosApi.quitarValorPersonalizado).toHaveBeenCalledWith(7, 11);
    const actualizador = props.actualizarValoresPersonalizados.mock.calls[0][0];
    expect(actualizador([{ tipo_pago_id: 11 }, { tipo_pago_id: 12 }])).toEqual([
      { tipo_pago_id: 12 },
    ]);
    expect(props.cargarDeudasEstudiante).toHaveBeenCalledWith(7);
    expect(props.cargarOpcionesVencidas).toHaveBeenCalledWith(7);
    expect(props.cargarOpcionesAdelanto).toHaveBeenCalledWith(7);
    expect(result.current.mensajeValoresPago).toBe(
      "MENSUALIDAD vuelve al precio del curso para Ana."
    );
  });

  it("si no confirma, no quita nada", async () => {
    Swal.fire.mockResolvedValueOnce({ isConfirmed: false });
    const { result } = renderHook(() => useValoresPersonalizadosPago(crearProps()));
    await abrir(result);

    await act(async () => result.current.volverAlPrecio(11));

    expect(pagosApi.quitarValorPersonalizado).not.toHaveBeenCalled();
  });

  it("descarta una respuesta tardía cuando ya se eligió otro estudiante", async () => {
    let resolver;
    pagosApi.obtenerValoresPagoEstudiante.mockImplementation(
      () => new Promise((resolve) => { resolver = resolve; })
    );
    const { result } = renderHook(() => useValoresPersonalizadosPago(crearProps()));

    act(() => {
      void result.current.abrirValoresPago();
    });
    expect(result.current.cargandoValoresPago).toBe(true);
    act(() => result.current.reiniciarValorPersonalizado());
    await act(async () => resolver(RESPUESTA));

    expect(result.current.filasValoresPago).toEqual([]);
    expect(result.current.cargandoValoresPago).toBe(false);
  });
});
