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
  copiarConfiguracionAnio,
  crearEstudianteEnPreparacion,
  crearAnioLectivo,
  guardarDecisionSalida,
  listarCandidatosMatricula,
  listarAniosLectivos,
  obtenerResumenAnio,
  promoverEstudiantes,
} from "./aniosLectivosApi";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contrato HTTP de años lectivos", () => {
  it("lista los años por la ruta del backend, sin parámetros, y devuelve los datos tal cual", async () => {
    const anios = [
      { id: 2, anio: 2027, estado: "preparacion" },
      { id: 1, anio: 2026, estado: "activo" },
    ];
    apiMock.get.mockResolvedValue({ data: anios });

    await expect(listarAniosLectivos()).resolves.toBe(anios);

    expect(apiMock.get).toHaveBeenCalledWith("/anios-lectivos");
  });

  it("acepta una señal opcional sin alterar la ruta", async () => {
    const controller = new AbortController();
    apiMock.get.mockResolvedValue({ data: [] });

    await listarAniosLectivos({ signal: controller.signal });

    expect(apiMock.get).toHaveBeenCalledWith("/anios-lectivos", {
      signal: controller.signal,
    });
  });

  it("propaga el error original sin reinterpretarlo", async () => {
    const error = { response: { status: 500, data: { detail: "Error interno" } } };
    apiMock.get.mockRejectedValue(error);

    await expect(listarAniosLectivos()).rejects.toBe(error);
  });

  it("crea el siguiente año sin enviar cuerpo", async () => {
    const creado = { id: 3, anio: 2027, estado: "preparacion" };
    apiMock.post.mockResolvedValue({ data: creado });

    await expect(crearAnioLectivo()).resolves.toBe(creado);

    expect(apiMock.post).toHaveBeenCalledWith("/anios-lectivos");
  });

  it("copia la configuración con las opciones elegidas", async () => {
    const opciones = {
      copiar_precios: true,
      copiar_carga_academica: false,
      copiar_directores: true,
    };
    const respuesta = { anio_destino_id: 3, copiados: { cursos: 12 } };
    apiMock.post.mockResolvedValue({ data: respuesta });

    await expect(copiarConfiguracionAnio(3, opciones)).resolves.toBe(respuesta);

    expect(apiMock.post).toHaveBeenCalledWith(
      "/anios-lectivos/3/copiar-configuracion",
      opciones,
    );
  });

  it("consulta candidatos del curso y el resumen del año en preparación", async () => {
    const candidatos = { candidatos: [{ id: 1, nombre: "Ana" }] };
    const resumen = { resumen: { estudiantes_matriculados: 1 } };
    apiMock.get
      .mockResolvedValueOnce({ data: candidatos })
      .mockResolvedValueOnce({ data: resumen });

    await expect(listarCandidatosMatricula(3, 10)).resolves.toBe(candidatos);
    await expect(obtenerResumenAnio(3)).resolves.toBe(resumen);

    expect(apiMock.get).toHaveBeenNthCalledWith(
      1,
      "/anios-lectivos/3/matriculas/candidatos",
      { params: { curso_origen_id: 10 } },
    );
    expect(apiMock.get).toHaveBeenNthCalledWith(
      2,
      "/anios-lectivos/3/resumen",
    );
  });

  it("promueve la selección explícita y permite el alta directa en preparación", async () => {
    const promocion = {
      curso_origen_id: 10,
      curso_destino_id: 20,
      estudiante_ids: [1, 2],
    };
    const estudiante = { nombre: "Ana", apellido: "Rojas", curso_id: 20 };
    const promovidos = { cantidad_matriculados: 2 };
    const creado = { id: 30, anio_lectivo_id: 3, curso_vigente_id: null };
    apiMock.post
      .mockResolvedValueOnce({ data: promovidos })
      .mockResolvedValueOnce({ data: creado });

    await expect(promoverEstudiantes(3, promocion)).resolves.toBe(promovidos);
    await expect(crearEstudianteEnPreparacion(3, estudiante)).resolves.toBe(creado);

    expect(apiMock.post).toHaveBeenNthCalledWith(
      1,
      "/anios-lectivos/3/matriculas/promocion",
      promocion,
    );
    expect(apiMock.post).toHaveBeenNthCalledWith(
      2,
      "/anios-lectivos/3/estudiantes",
      estudiante,
    );
  });

  it("guarda o quita la marca de salida con PUT y el cuerpo tal cual (paso 6.6)", async () => {
    const respuesta = { estado_salida: "egresado", estudiante_ids: [9], cantidad: 1 };
    apiMock.put.mockResolvedValue({ data: respuesta });

    await expect(
      guardarDecisionSalida(3, { estudiante_ids: [9], estado_salida: "egresado" }),
    ).resolves.toBe(respuesta);
    await guardarDecisionSalida(3, { estudiante_ids: [9], estado_salida: null });

    expect(apiMock.put).toHaveBeenNthCalledWith(
      1,
      "/anios-lectivos/3/matriculas/salida",
      { estudiante_ids: [9], estado_salida: "egresado" },
    );
    expect(apiMock.put).toHaveBeenNthCalledWith(
      2,
      "/anios-lectivos/3/matriculas/salida",
      { estudiante_ids: [9], estado_salida: null },
    );
  });
});
