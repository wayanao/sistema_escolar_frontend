import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../utils/api";
import pagosApi from "./pagosApi";

vi.mock("../utils/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("pagosApi", () => {
  beforeEach(() => {
    api.get.mockReset();
    api.post.mockReset();
    api.put.mockReset();
    api.delete.mockReset();
  });

  it.each([
    ["obtenerEstudiantes", [], "/estudiantes"],
    ["obtenerTiposPagos", [], "/tipos-pagos"],
    ["obtenerHistorialPagos", [7], "/pagos/7"],
    ["obtenerDeudasEstudiante", [7], "/estudiantes/7/deudas"],
    ["obtenerVentasPendientes", [7], "/api/ventas/pendientes/7"],
    ["obtenerOpcionesVencidas", [7], "/pagos/vencidos/opciones/7"],
    ["obtenerOpcionesAdelanto", [7], "/pagos/adelanto/opciones/7"],
    ["obtenerCursos", [], "/cursos"],
    [
      "obtenerValoresPersonalizados",
      [7],
      "/estudiantes/7/valores-pago-personalizados",
    ],
    ["obtenerValoresPagoEstudiante", [7], "/estudiantes/7/valores-pago"],
  ])("%s consulta su ruta y devuelve los datos", async (metodo, argumentos, ruta) => {
    const datos = { contrato: metodo };
    api.get.mockResolvedValue({ data: datos });

    await expect(pagosApi[metodo](...argumentos)).resolves.toBe(datos);
    expect(api.get).toHaveBeenCalledWith(ruta);
  });

  it.each([
    ["obtenerTiposPagos", [], "/tipos-pagos"],
    ["obtenerDeudasEstudiante", [7], "/estudiantes/7/deudas"],
    ["obtenerOpcionesVencidas", [7], "/pagos/vencidos/opciones/7"],
    ["obtenerOpcionesAdelanto", [7], "/pagos/adelanto/opciones/7"],
    [
      "obtenerValoresPersonalizados",
      [7],
      "/estudiantes/7/valores-pago-personalizados",
    ],
    ["obtenerValoresPagoEstudiante", [7], "/estudiantes/7/valores-pago"],
  ])("%s consulta el año del pago solo cuando se envía", async (metodo, argumentos, ruta) => {
    const datos = { contrato: metodo, anio: 2027 };
    api.get.mockResolvedValue({ data: datos });

    await expect(
      pagosApi[metodo](...argumentos, {
        parametrosAnio: { anio_lectivo_id: 2 },
      })
    ).resolves.toBe(datos);
    expect(api.get).toHaveBeenCalledWith(ruta, {
      params: { anio_lectivo_id: 2 },
    });
  });

  it("guarda el valor personalizado con su payload intacto", async () => {
    const payload = { valor: 85000, motivo: "Acuerdo", activo: true };
    const datos = { valores: [{ id: 3 }] };
    api.put.mockResolvedValue({ data: datos });

    await expect(
      pagosApi.guardarValorPersonalizado(7, 11, payload)
    ).resolves.toBe(datos);
    expect(api.put).toHaveBeenCalledWith(
      "/estudiantes/7/valores-pago-personalizados/11",
      payload
    );
  });

  it("retira el valor personalizado usando ambos identificadores", async () => {
    const datos = { ok: true };
    api.delete.mockResolvedValue({ data: datos });

    await expect(pagosApi.quitarValorPersonalizado(7, 11)).resolves.toBe(datos);
    expect(api.delete).toHaveBeenCalledWith(
      "/estudiantes/7/valores-pago-personalizados/11"
    );
  });

  it("registra un pago normal sin transformar el payload", async () => {
    const payload = { estudiante_id: 7, monto: "100000", metodos: [] };
    const datos = { pago_id: 42 };
    api.post.mockResolvedValue({ data: datos });

    await expect(pagosApi.registrarPago(payload)).resolves.toBe(datos);
    expect(api.post).toHaveBeenCalledWith("/pagos", payload);
  });

  it("registra un adelanto sin transformar el payload", async () => {
    const payload = { estudiante_id: 7, monto_distribuir: 150000, metodos: [] };
    const datos = { periodos: ["2026-08", "2026-09"] };
    api.post.mockResolvedValue({ data: datos });

    await expect(pagosApi.registrarPagoAdelantado(payload)).resolves.toBe(datos);
    expect(api.post).toHaveBeenCalledWith("/pagos/adelanto", payload);
  });

  it("anula un pago con el motivo intacto", async () => {
    const payload = { motivo: "Registro duplicado" };
    const datos = { ok: true };
    api.post.mockResolvedValue({ data: datos });

    await expect(pagosApi.anularPago(42, payload)).resolves.toBe(datos);
    expect(api.post).toHaveBeenCalledWith("/pagos/42/anular", payload);
  });

  it("propaga sin reemplazar los errores del cliente HTTP", async () => {
    const error = new Error("sin conexión");
    api.get.mockRejectedValue(error);

    await expect(pagosApi.obtenerEstudiantes()).rejects.toBe(error);
  });
});
