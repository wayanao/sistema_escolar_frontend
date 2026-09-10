import { describe, expect, it } from "vitest";
import {
  METODOS_PAGO,
  crearPagoInicial,
  crearPayloadPagoAdelantado,
  crearPayloadPagoNormal,
  crearValorPersonalizadoInicial,
  normalizarOpcionesAdelanto,
  normalizarOpcionesVencidas,
  normalizarTiposPagos,
} from "./contratos";

describe("contratos de pagos", () => {
  it("conserva los métodos de pago disponibles y su orden", () => {
    expect(METODOS_PAGO).toEqual([
      "efectivo",
      "tarjeta",
      "transferencia",
      "subsidio",
    ]);
  });

  it("crea estados iniciales nuevos con los valores actuales", () => {
    const primero = crearPagoInicial(7, "2026-08-04");
    const segundo = crearPagoInicial("", "2026-08-05");

    expect(primero).toEqual({
      estudiante_id: 7,
      descripcion: "",
      fecha: "2026-08-04",
      monto: "",
      venta_id: null,
      metodos: [],
      tipo_pago_id_adelanto: "",
      cantidad_meses: 1,
      modalidad_adelanto: "meses",
      monto_distribuir: "",
      aplicaciones: [],
    });
    expect(segundo.estudiante_id).toBe("");
    expect(segundo.fecha).toBe("2026-08-05");
    expect(segundo.metodos).not.toBe(primero.metodos);
    expect(segundo.aplicaciones).not.toBe(primero.aplicaciones);

    expect(crearValorPersonalizadoInicial()).toEqual({
      tipo_pago_id: "",
      valor: "",
      motivo: "",
    });
  });

  it("normaliza tipos activos y opciones vencidas sin reinterpretarlas", () => {
    const activos = [{ id: 1 }, { id: 2, activo: false }, { id: 3, activo: true }];
    const vencidas = [{ tipo_pago_id: 11, cuotas: [] }];

    expect(normalizarTiposPagos(activos)).toEqual([{ id: 1 }, { id: 3, activo: true }]);
    expect(normalizarTiposPagos({})).toEqual([]);
    expect(normalizarOpcionesVencidas(vencidas)).toBe(vencidas);
    expect(normalizarOpcionesVencidas(null)).toEqual([]);
  });

  it("normaliza saldos, estados y total de las opciones de adelanto", () => {
    const entrada = [
      {
        tipo_pago_id: 11,
        valor_unitario: "100000",
        mes_final: "11",
        periodos_disponibles: [
          { periodo: "2026-08" },
          { periodo: "2026-09", saldo: "80000", estado: "parcial" },
          { periodo: "2026-10", saldo: 0, estado: "" },
        ],
      },
      {
        tipo_pago_id: 12,
        total_disponible: 0,
        periodos_disponibles: [{ periodo: "2026-08", saldo: 25000, estado: "" }],
      },
    ];

    expect(normalizarOpcionesAdelanto(entrada)).toEqual([
      {
        tipo_pago_id: 11,
        valor_unitario: "100000",
        mes_final: 11,
        periodos_disponibles: [
          { periodo: "2026-08", saldo: 100000, estado: "disponible" },
          { periodo: "2026-09", saldo: 80000, estado: "parcial" },
          { periodo: "2026-10", saldo: 0, estado: "disponible" },
        ],
        total_disponible: 180000,
      },
      {
        tipo_pago_id: 12,
        total_disponible: 0,
        mes_final: 12,
        periodos_disponibles: [
          { periodo: "2026-08", saldo: 25000, estado: "disponible" },
        ],
      },
    ]);
    expect(normalizarOpcionesAdelanto({ opciones: entrada })).toEqual([]);
  });

  it("usa diciembre cuando una API anterior omite mes_final", () => {
    expect(normalizarOpcionesAdelanto([{
      tipo_pago_id: 11,
      periodos_disponibles: [],
    }])[0].mes_final).toBe(12);
  });

  it("construye el payload normal conservando cadenas y convirtiendo aplicaciones", () => {
    const pago = {
      estudiante_id: "",
      descripcion: "Pensión",
      fecha: "2026-08-04",
      monto: "100000",
      venta_id: null,
      metodos: [{ tipo: "efectivo", monto: "100000", nota: "" }],
      tipo_pago_id_adelanto: "11",
      cantidad_meses: 1,
      modalidad_adelanto: "meses",
      monto_distribuir: "",
      aplicaciones: [{ tipo_pago_id: "11", periodo: "2026-06", monto: "100000" }],
    };

    expect(crearPayloadPagoNormal(pago, 7)).toEqual({
      estudiante_id: 7,
      descripcion: "Pensión",
      fecha: "2026-08-04",
      monto: "100000",
      metodos: [{ tipo: "efectivo", monto: "100000", nota: "" }],
      aplicaciones: [{ tipo_pago_id: 11, periodo: "2026-06", monto: 100000 }],
    });
    expect(pago.tipo_pago_id_adelanto).toBe("11");
    expect(pago.aplicaciones[0].monto).toBe("100000");
  });

  it("conserva una venta y elimina aplicaciones vacías en el payload normal", () => {
    const pago = {
      estudiante_id: 7,
      descripcion: "Uniforme",
      fecha: "2026-08-04",
      monto: 50000,
      venta_id: 9,
      metodos: [],
      tipo_pago_id_adelanto: "",
      cantidad_meses: 1,
      modalidad_adelanto: "meses",
      monto_distribuir: "",
      aplicaciones: [],
    };

    const payload = crearPayloadPagoNormal(pago, 99);

    expect(payload.venta_id).toBe(9);
    expect(payload.estudiante_id).toBe(7);
    expect(payload).not.toHaveProperty("aplicaciones");
  });

  it("construye adelantos por meses o monto con métodos numéricos", () => {
    const pago = {
      tipo_pago_id_adelanto: "11",
      cantidad_meses: "2",
      monto_distribuir: "150000",
      fecha: "2026-08-04",
      metodos: [{ tipo: "subsidio", monto: "150000", nota: "Convenio" }],
    };

    expect(crearPayloadPagoAdelantado(pago, 7, false)).toEqual({
      estudiante_id: 7,
      tipo_pago_id: 11,
      cantidad_meses: 2,
      fecha: "2026-08-04",
      metodos: [{ tipo: "subsidio", monto: 150000, nota: "Convenio" }],
    });
    expect(crearPayloadPagoAdelantado(pago, 7, true)).toEqual({
      estudiante_id: 7,
      tipo_pago_id: 11,
      monto_distribuir: 150000,
      fecha: "2026-08-04",
      metodos: [{ tipo: "subsidio", monto: 150000, nota: "Convenio" }],
    });
    expect(pago.metodos[0].monto).toBe("150000");
  });
});
