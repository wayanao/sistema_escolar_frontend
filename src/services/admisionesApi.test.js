import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

import {
  actualizarAdmision,
  borrarAdmision,
  cambiarResultadoAdmision,
  listarAdmisiones,
  matricularAdmision,
  obtenerAdmision,
  registrarAdmision,
} from "./admisionesApi";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contrato HTTP de admisiones", () => {
  it("lista las admisiones del año, sin filtro (se filtra en el navegador)", async () => {
    const datos = { admisiones: [] };
    apiMock.get.mockResolvedValue({ data: datos });

    await expect(listarAdmisiones(3)).resolves.toBe(datos);

    expect(apiMock.get).toHaveBeenCalledWith("/anios-lectivos/3/admisiones");
  });

  it("acepta una señal para descartar una lista vieja", async () => {
    const controller = new AbortController();
    apiMock.get.mockResolvedValue({ data: {} });

    await listarAdmisiones(3, { signal: controller.signal });

    expect(apiMock.get).toHaveBeenCalledWith("/anios-lectivos/3/admisiones", {
      signal: controller.signal,
    });
  });

  it("registra un aspirante en el año", async () => {
    const aspirante = { nombre: "Lina" };
    apiMock.post.mockResolvedValue({ data: { id: 7 } });

    await expect(registrarAdmision(3, aspirante)).resolves.toEqual({ id: 7 });

    expect(apiMock.post).toHaveBeenCalledWith("/anios-lectivos/3/admisiones", aspirante);
  });

  it("lee una admisión completa, con señal opcional", async () => {
    const controller = new AbortController();
    apiMock.get.mockResolvedValue({ data: { id: 7 } });

    await obtenerAdmision(7);
    await obtenerAdmision(7, { signal: controller.signal });

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/admisiones/7");
    expect(apiMock.get).toHaveBeenNthCalledWith(2, "/admisiones/7", {
      signal: controller.signal,
    });
  });

  it("edita aspirante y entrevista", async () => {
    const datos = { nombre: "Lina", entrevistador: "Ruiz" };
    apiMock.put.mockResolvedValue({ data: { id: 7 } });

    await actualizarAdmision(7, datos);

    expect(apiMock.put).toHaveBeenCalledWith("/admisiones/7", datos);
  });

  it("guarda el resultado por su propia ruta", async () => {
    const resultado = { resultado: "no_aprobado", motivo_resultado: "Cupo" };
    apiMock.put.mockResolvedValue({ data: { id: 7 } });

    await cambiarResultadoAdmision(7, resultado);

    expect(apiMock.put).toHaveBeenCalledWith("/admisiones/7/resultado", resultado);
  });

  it("borra una admisión", async () => {
    apiMock.delete.mockResolvedValue({ data: { mensaje: "Admisión borrada", id: 7 } });

    await expect(borrarAdmision(7)).resolves.toEqual({ mensaje: "Admisión borrada", id: 7 });

    expect(apiMock.delete).toHaveBeenCalledWith("/admisiones/7");
  });

  it("matricula con la ficha del estudiante (paso E5)", async () => {
    const ficha = { nombre: "Lina", curso_id: "20" };
    const respuesta = { estudiante_id: 55, admision: { id: 7 } };
    apiMock.post.mockResolvedValue({ data: respuesta });

    await expect(matricularAdmision(7, ficha)).resolves.toBe(respuesta);

    expect(apiMock.post).toHaveBeenCalledWith("/admisiones/7/matricular", ficha);
  });

  it("propaga el error original sin reinterpretarlo", async () => {
    const error = { response: { status: 409, data: { detail: "No está en preparación." } } };
    apiMock.post.mockRejectedValue(error);

    await expect(registrarAdmision(3, {})).rejects.toBe(error);
  });
});
