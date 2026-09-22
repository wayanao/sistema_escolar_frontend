import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

import {
  crearColumnaSeguimiento,
  eliminarColumnaSeguimiento,
  guardarMarcasSeguimiento,
  obtenerCursosListasSeguimiento,
  obtenerListaSeguimiento,
} from "./listasSeguimientoApi";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contrato HTTP de listas de seguimiento", () => {
  it("usa las rutas que fija el backend", async () => {
    const cursos = [{ id: 12 }];
    const lista = { curso_id: 12, columnas: [], estudiantes: [] };
    apiMock.get
      .mockResolvedValueOnce({ data: cursos })
      .mockResolvedValueOnce({ data: lista });

    await expect(obtenerCursosListasSeguimiento()).resolves.toBe(cursos);
    await expect(obtenerListaSeguimiento(12)).resolves.toBe(lista);

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/cursos");
    expect(apiMock.get).toHaveBeenNthCalledWith(2, "/listas-seguimiento/12");
  });

  it("pide su propia lista de cursos, sin selector compartido", async () => {
    apiMock.get.mockResolvedValue({ data: [] });

    await obtenerCursosListasSeguimiento();

    expect(apiMock.get).toHaveBeenCalledWith("/cursos");
  });

  it("crea una columna mandando solo el nombre", async () => {
    apiMock.post.mockResolvedValue({ data: { id: 7, nombre: "Compro el libro" } });

    await expect(
      crearColumnaSeguimiento(12, "Compro el libro"),
    ).resolves.toEqual({ id: 7, nombre: "Compro el libro" });

    expect(apiMock.post).toHaveBeenCalledWith("/listas-seguimiento/12/columnas", {
      nombre: "Compro el libro",
    });
  });

  it("borra una columna por su id dentro del curso", async () => {
    apiMock.delete.mockResolvedValue({ data: { mensaje: "Columna eliminada" } });

    await eliminarColumnaSeguimiento(12, 5);

    expect(apiMock.delete).toHaveBeenCalledWith("/listas-seguimiento/12/columnas/5");
  });

  it("manda el lote de marcas como lista pelada", async () => {
    const payload = [
      { columna_id: 5, estudiante_id: 101, marcado: true, nota: "Llegó tarde" },
    ];
    apiMock.post.mockResolvedValue({ data: { mensaje: "Cambios guardados", guardadas: 1 } });

    await expect(guardarMarcasSeguimiento(12, payload)).resolves.toEqual({
      mensaje: "Cambios guardados",
      guardadas: 1,
    });

    expect(apiMock.post).toHaveBeenCalledWith("/listas-seguimiento/12/marcas", payload);
  });
});

describe("cancelación de peticiones en curso", () => {
  it("pasa la señal a las lecturas cuando se le da", async () => {
    const controller = new AbortController();
    apiMock.get.mockResolvedValue({ data: [] });

    await obtenerCursosListasSeguimiento({ signal: controller.signal });
    await obtenerListaSeguimiento(12, { signal: controller.signal });

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/cursos", {
      signal: controller.signal,
    });
    expect(apiMock.get).toHaveBeenNthCalledWith(2, "/listas-seguimiento/12", {
      signal: controller.signal,
    });
  });

  it("pasa la señal a las escrituras cuando se le da", async () => {
    const controller = new AbortController();
    apiMock.post.mockResolvedValue({ data: {} });
    apiMock.delete.mockResolvedValue({ data: {} });

    await crearColumnaSeguimiento(12, "Nueva", { signal: controller.signal });
    await eliminarColumnaSeguimiento(12, 5, { signal: controller.signal });
    await guardarMarcasSeguimiento(12, [], { signal: controller.signal });

    expect(apiMock.post).toHaveBeenNthCalledWith(
      1,
      "/listas-seguimiento/12/columnas",
      { nombre: "Nueva" },
      { signal: controller.signal },
    );
    expect(apiMock.delete).toHaveBeenCalledWith("/listas-seguimiento/12/columnas/5", {
      signal: controller.signal,
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      2,
      "/listas-seguimiento/12/marcas",
      [],
      { signal: controller.signal },
    );
  });

  it("no agrega opciones cuando no hay señal", async () => {
    apiMock.get.mockResolvedValue({ data: [] });
    apiMock.post.mockResolvedValue({ data: {} });

    await obtenerListaSeguimiento(12);
    await guardarMarcasSeguimiento(12, []);

    expect(apiMock.get).toHaveBeenCalledWith("/listas-seguimiento/12");
    expect(apiMock.post).toHaveBeenCalledWith("/listas-seguimiento/12/marcas", []);
  });
});

describe("lo que el servicio no hace", () => {
  it("deja pasar el error sin convertirlo en mensaje de pantalla", async () => {
    const conflicto = Object.assign(new Error("Request failed"), {
      response: { status: 409, data: { detail: "Ya existe una columna..." } },
    });
    apiMock.post.mockRejectedValue(conflicto);

    await expect(crearColumnaSeguimiento(12, "Repetida")).rejects.toBe(conflicto);
  });

  it("no manda ninguna cabecera de tenant: lo resuelve el backend", async () => {
    apiMock.get.mockResolvedValue({ data: [] });

    await obtenerListaSeguimiento(12);

    const opciones = apiMock.get.mock.calls[0][1];
    expect(opciones).toBeUndefined();
  });
});
