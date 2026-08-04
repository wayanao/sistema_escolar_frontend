import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import pagosApi from "../../services/pagosApi";
import useValoresPersonalizadosPago from "./useValoresPersonalizadosPago";

vi.mock("../../services/pagosApi", () => ({
  default: {
    guardarValorPersonalizado: vi.fn(),
    quitarValorPersonalizado: vi.fn(),
  },
}));

vi.mock("sweetalert2", () => ({
  default: { fire: vi.fn() },
}));

function crearProps(sobrescrituras = {}) {
  return {
    selectedEstudiante: { id: 7 },
    valoresPersonalizados: [],
    actualizarValoresPersonalizados: vi.fn(),
    cargarDeudasEstudiante: vi.fn(),
    cargarOpcionesVencidas: vi.fn(),
    ...sobrescrituras,
  };
}

describe("useValoresPersonalizadosPago", () => {
  beforeEach(() => {
    pagosApi.guardarValorPersonalizado.mockReset();
    pagosApi.quitarValorPersonalizado.mockReset();
    Swal.fire.mockReset();
  });

  it("valida los datos antes de guardar", async () => {
    const { result } = renderHook(() => useValoresPersonalizadosPago(crearProps()));

    await act(async () => result.current.guardarValorPersonalizado());

    expect(pagosApi.guardarValorPersonalizado).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(
      "Datos incompletos",
      "Selecciona un concepto y escribe un valor válido.",
      "warning"
    );
  });

  it("guarda el payload, actualiza la lista y recarga las deudas", async () => {
    const props = crearProps();
    pagosApi.guardarValorPersonalizado.mockResolvedValue({ valores: [{ id: 1 }] });
    const { result } = renderHook(() => useValoresPersonalizadosPago(props));
    act(() => result.current.seleccionarTipoValorPersonalizado("11"));
    act(() => result.current.actualizarCampoValorPersonalizado("valor", "85000"));
    act(() => result.current.actualizarCampoValorPersonalizado("motivo", "Acuerdo"));

    await act(async () => result.current.guardarValorPersonalizado());

    expect(pagosApi.guardarValorPersonalizado).toHaveBeenCalledWith(7, 11, {
      valor: 85000,
      motivo: "Acuerdo",
      activo: true,
    });
    expect(props.actualizarValoresPersonalizados).toHaveBeenCalledWith([{ id: 1 }]);
    expect(props.cargarDeudasEstudiante).toHaveBeenCalledWith(7);
    expect(props.cargarOpcionesVencidas).toHaveBeenCalledWith(7);
    expect(result.current.valorPersonalizadoData).toEqual({
      tipo_pago_id: "",
      valor: "",
      motivo: "",
    });
  });

  it("retira el valor confirmado y conserva la actualización optimista actual", async () => {
    const props = crearProps();
    Swal.fire.mockResolvedValueOnce({ isConfirmed: true });
    pagosApi.quitarValorPersonalizado.mockResolvedValue({});
    const { result } = renderHook(() => useValoresPersonalizadosPago(props));
    const valor = { tipo_pago_id: 11, tipo_pago_nombre: "Pensión" };

    await act(async () => result.current.quitarValorPersonalizado(valor));

    expect(pagosApi.quitarValorPersonalizado).toHaveBeenCalledWith(7, 11);
    const actualizador = props.actualizarValoresPersonalizados.mock.calls[0][0];
    expect(actualizador([{ tipo_pago_id: 11 }, { tipo_pago_id: 12 }])).toEqual([
      { tipo_pago_id: 12 },
    ]);
    expect(props.cargarDeudasEstudiante).toHaveBeenCalledWith(7);
    expect(props.cargarOpcionesVencidas).toHaveBeenCalledWith(7);
  });
});
