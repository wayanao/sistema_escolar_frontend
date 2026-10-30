import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

import {
  crearAnotacion,
  editarAnotacion,
  firmarAnotacion,
  firmarAnotacionesDelPeriodo,
  listarMisEstudiantes,
  obtenerFirmantesSugeridos,
  obtenerObservador,
} from "./observadorApi";

beforeEach(() => {
  apiMock.get.mockReset();
  apiMock.post.mockReset();
  apiMock.put.mockReset();
});

describe("contrato HTTP del observador del estudiante", () => {
  it("pide la bitácora completa cuando no se le da periodo", async () => {
    const bitacora = { nivel: "primaria", anotaciones: [] };
    apiMock.get.mockResolvedValue({ data: bitacora });

    await expect(obtenerObservador(42)).resolves.toBe(bitacora);

    // Sin `params`: el periodo es una etiqueta opcional y sin él el servidor
    // devuelve el año entero, que es el caso por defecto.
    expect(apiMock.get).toHaveBeenCalledWith("/observador/42", {});
  });

  it("manda el periodo como parámetro de consulta cuando se le da", async () => {
    apiMock.get.mockResolvedValue({ data: { nivel: null, anotaciones: [] } });

    await obtenerObservador(42, { periodo: 3 });

    expect(apiMock.get).toHaveBeenCalledWith("/observador/42", {
      params: { periodo: 3 },
    });
  });

  it("propaga la señal de cancelación para descartar respuestas viejas", async () => {
    const controller = new AbortController();
    apiMock.get.mockResolvedValue({ data: { nivel: null, anotaciones: [] } });

    await obtenerObservador(42, { periodo: 2, signal: controller.signal });

    expect(apiMock.get).toHaveBeenCalledWith("/observador/42", {
      params: { periodo: 2 },
      signal: controller.signal,
    });
  });

  it("mirando otro año (la ficha del admin), manda el año junto al periodo", async () => {
    const controller = new AbortController();
    const parametrosAnio = { anio_lectivo_id: 3 };
    apiMock.get.mockResolvedValue({ data: { nivel: null, anotaciones: [] } });

    await obtenerObservador(42, { periodo: 2, signal: controller.signal, parametrosAnio });
    await obtenerObservador(42, { periodo: null, parametrosAnio });

    expect(apiMock.get.mock.calls).toEqual([
      ["/observador/42", { params: { periodo: 2, anio_lectivo_id: 3 }, signal: controller.signal }],
      ["/observador/42", { params: { anio_lectivo_id: 3 } }],
    ]);
  });

  it("pide los alumnos del profesor sin mandarle ninguna clase", async () => {
    const alumnos = [{ estudiante_id: 11, nombre: "Ana", curso: "PRIMERO-A" }];
    apiMock.get.mockResolvedValue({ data: alumnos });

    await expect(listarMisEstudiantes()).resolves.toBe(alumnos);

    // Sin parametros: el profesor sale del token y no hay clase de la que
    // depender. Es lo que suelta la pantalla de la asignacion elegida.
    expect(apiMock.get).toHaveBeenCalledWith("/observador/mis-estudiantes", undefined);
  });

  it("propaga la señal de cancelación al pedir la lista", async () => {
    const controller = new AbortController();
    apiMock.get.mockResolvedValue({ data: [] });

    await listarMisEstudiantes({ signal: controller.signal });

    expect(apiMock.get).toHaveBeenCalledWith("/observador/mis-estudiantes", {
      signal: controller.signal,
    });
  });

  it("crea una anotación sin mandar quién la firma", async () => {
    apiMock.post.mockResolvedValue({ data: { id: 31 } });
    const payload = {
      estudiante_id: 42,
      periodo: 3,
      positiva: false,
      conductual: "Se para mucho.",
      cognitivo: "",
      lenguaje: "",
    };

    await expect(crearAnotacion(payload)).resolves.toStrictEqual({ id: 31 });

    expect(apiMock.post).toHaveBeenCalledWith("/observador", payload);
    // El autor sale del token. Si viajara desde el cliente, un profesor podría
    // firmar una anotación con el nombre de otro.
    expect(apiMock.post.mock.calls[0][1]).not.toHaveProperty("profesor_id");
  });

  it("edita una anotación sin tocar el estudiante ni el periodo", async () => {
    apiMock.put.mockResolvedValue({ data: { id: 31 } });
    const payload = {
      positiva: true,
      conductual: "Ya no se para.",
      cognitivo: "",
      lenguaje: "",
    };

    await expect(editarAnotacion(31, payload)).resolves.toStrictEqual({ id: 31 });

    expect(apiMock.put).toHaveBeenCalledWith("/observador/31", payload);
    expect(apiMock.put.mock.calls[0][1]).not.toHaveProperty("periodo");
    expect(apiMock.put.mock.calls[0][1]).not.toHaveProperty("estudiante_id");
  });

  it("firma una anotación sin mandar quién la toma ni la hora", async () => {
    const firmada = { id: 99, anotacion_id: 12, integra: true };
    apiMock.post.mockResolvedValue({ data: firmada });
    const payload = {
      firmante_nombre: "Maria Lopez",
      firmante_tipo_documento: "Cédula",
      firmante_documento: "52123456",
      firmante_parentesco: "Madre",
      imagen: "data:image/png;base64,AAAA",
      version: "a1b2c3",
    };

    await expect(firmarAnotacion(12, payload)).resolves.toStrictEqual(firmada);

    expect(apiMock.post).toHaveBeenCalledWith("/observador/anotaciones/12/firma", payload);
    // Quién la toma y la hora los pone el servidor (invariante 4).
    expect(apiMock.post.mock.calls[0][1]).not.toHaveProperty("tomada_por_profesor_id");
    expect(apiMock.post.mock.calls[0][1]).not.toHaveProperty("firmada_en");
  });

  it("firma un periodo entero mandando la lista exacta que se mostró", async () => {
    const firmadas = [{ id: 99, anotacion_id: 12 }, { id: 100, anotacion_id: 13 }];
    apiMock.post.mockResolvedValue({ data: firmadas });
    const payload = {
      firmante_nombre: "Maria Lopez",
      firmante_tipo_documento: "Cédula",
      firmante_documento: "52123456",
      firmante_parentesco: "Madre",
      imagen: "data:image/png;base64,AAAA",
      anotaciones: [{ id: 12, version: "v12" }, { id: 13, version: "v13" }],
    };

    await expect(firmarAnotacionesDelPeriodo(11, payload)).resolves.toStrictEqual(firmadas);

    expect(apiMock.post).toHaveBeenCalledWith("/observador/11/firmas", payload);
  });

  it("pide los acudientes sugeridos del estudiante, cancelables", async () => {
    const sugeridos = [{ parentesco: "Madre", nombre: "Maria Lopez" }];
    apiMock.get.mockResolvedValue({ data: sugeridos });
    const controller = new AbortController();

    await expect(
      obtenerFirmantesSugeridos(11, { signal: controller.signal }),
    ).resolves.toStrictEqual(sugeridos);

    expect(apiMock.get).toHaveBeenCalledWith("/observador/11/firmantes-sugeridos", {
      signal: controller.signal,
    });
  });

  it("no expone ningún contrato de borrado", async () => {
    const modulo = await import("./observadorApi");

    // Nadie borra una anotación, y una firma tampoco se edita ni se borra
    // (FIRMA_OBSERVADOR.md): no hay DELETE en el servidor y no debe aparecer
    // aquí un atajo que lo sugiera.
    expect(Object.keys(modulo).sort()).toStrictEqual([
      "crearAnotacion",
      "editarAnotacion",
      "firmarAnotacion",
      "firmarAnotacionesDelPeriodo",
      "listarMisEstudiantes",
      "obtenerFirmantesSugeridos",
      "obtenerObservador",
    ]);
    expect(apiMock).not.toHaveProperty("delete");
  });
});
