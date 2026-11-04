import { describe, expect, it } from "vitest";
import { crearResumenDeuda } from "./resumenDeuda";

const pension = {
  concepto: "Pensión",
  concepto_id: 11,
  tipo_cobro: "mensual",
  deuda: 300000,
  pagado: 600000,
  mora: 0,
  cuotas_vencidas: 9,
  valor_personalizado: true,
};

const matricula = {
  concepto: "Matrícula",
  concepto_id: 12,
  tipo_cobro: "anual",
  deuda: 200000,
  pagado: 100000,
  mora: 15000,
  valor_personalizado: false,
};

describe("crearResumenDeuda", () => {
  it("arma una fila por concepto y por cargo de inventario, con su total", () => {
    const { filas, total } = crearResumenDeuda({
      deudas: [pension, matricula],
      ventasPendientes: [{ id: 80, descripcion: "Uniforme", total: 90000 }],
      opcionesVencidas: [
        { tipo_pago_id: 11, cuotas: [{ periodo: "2026-08" }, { periodo: "2026-09" }, { periodo: "2026-10" }] },
      ],
    });

    expect(filas).toEqual([
      {
        clave: "concepto-11",
        nombre: "Pensión",
        monto: 300000,
        mesesPendientes: 3,
        abonado: 0,
        mora: 0,
        valorPersonalizado: true,
        inventario: false,
        alDia: false,
        cobro: { concepto: "Pensión" },
      },
      {
        clave: "concepto-12",
        nombre: "Matrícula",
        monto: 200000,
        mesesPendientes: 0,
        abonado: 100000,
        mora: 15000,
        valorPersonalizado: false,
        inventario: false,
        alDia: false,
        cobro: { concepto: "Matrícula" },
      },
      {
        clave: "venta-80",
        nombre: "Uniforme",
        monto: 90000,
        mesesPendientes: 0,
        abonado: 0,
        mora: 0,
        valorPersonalizado: false,
        inventario: true,
        alDia: false,
        cobro: { ventaId: 80 },
      },
    ]);
    expect(total).toBe(590000);
  });

  it("agrega al final los conceptos al día para adelantar, sin sumarlos al total", () => {
    const { filas, total } = crearResumenDeuda({
      deudas: [matricula],
      conceptosAlDia: [
        { tipo_pago_id: 11, concepto: "Pensión", valor_unitario: 100000, max_meses: 2 },
      ],
    });

    expect(filas.at(-1)).toEqual({
      clave: "adelanto-11",
      nombre: "Pensión",
      alDia: true,
      valorMes: 100000,
      mesesPorAdelantar: 2,
      cobro: { concepto: "Pensión" },
    });
    expect(total).toBe(200000);
  });

  it("cuenta los meses por pagar, no todas las cuotas vencidas", () => {
    const { filas } = crearResumenDeuda({
      deudas: [pension],
      opcionesVencidas: [{ tipo_pago_id: 11, cuotas: [{ periodo: "2026-10" }] }],
    });

    expect(filas[0].mesesPendientes).toBe(1);
  });

  it("no inventa meses si todavía no llegaron las opciones vencidas", () => {
    const { filas } = crearResumenDeuda({ deudas: [pension] });

    expect(filas[0].mesesPendientes).toBe(0);
  });

  it("suma sin arrastrar decimales y sin filas da cero", () => {
    expect(
      crearResumenDeuda({
        ventasPendientes: [
          { id: 1, descripcion: "A", total: 0.1 },
          { id: 2, descripcion: "B", total: 0.2 },
        ],
      }).total
    ).toBe(0.3);
    expect(crearResumenDeuda()).toEqual({ filas: [], total: 0 });
  });
});
