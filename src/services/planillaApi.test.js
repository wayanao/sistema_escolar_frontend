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
  crearSubnotaPlanilla,
  eliminarSubnotaPlanilla,
  eliminarTipoEvaluacionPlanilla,
  guardarCalificacionesSubnotas,
  guardarNotaPlanilla,
  listarClasesProfesorPlanilla,
  obtenerPlanillaNotas,
  renombrarSubnotaPlanilla,
} from "./planillaApi";

beforeEach(() => {
  apiMock.get.mockReset();
  apiMock.post.mockReset();
  apiMock.put.mockReset();
  apiMock.delete.mockReset();
});

describe("contrato HTTP de la planilla de notas", () => {
  it("consulta clases y planilla con las rutas vigentes", async () => {
    const clases = [{ id: 88, materia: "Ciencias Naturales" }];
    const planilla = { columnas: ["quiz"], data: [{ estudiante_id: 501 }] };
    apiMock.get
      .mockResolvedValueOnce({ data: clases })
      .mockResolvedValueOnce({ data: planilla });

    await expect(listarClasesProfesorPlanilla(12)).resolves.toBe(clases);
    await expect(obtenerPlanillaNotas(88, 3)).resolves.toBe(planilla);

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/mis-clases/12");
    expect(apiMock.get).toHaveBeenNthCalledWith(2, "/planilla-excel/88/3");
  });

  it("guarda una nota enviando el payload sin alterarlo", async () => {
    const payload = {
      estudiante_id: 501,
      asignacion_id: 88,
      nota: 5,
      descripcion: "quiz",
      periodo: 3,
      tipo_evaluacion: "numerica",
      valoracion: null,
    };
    const respuesta = { mensaje: "Nota guardada" };
    apiMock.post.mockResolvedValue({ data: respuesta });

    await expect(guardarNotaPlanilla(payload)).resolves.toBe(respuesta);

    expect(apiMock.post).toHaveBeenCalledWith("/planilla/nota", payload);
    expect(apiMock.post.mock.calls[0][1]).toBe(payload);
  });

  it("elimina un tipo de evaluación codificando la descripción en la URL", async () => {
    const respuesta = { mensaje: "Tipo eliminado" };
    apiMock.delete.mockResolvedValue({ data: respuesta });

    await expect(eliminarTipoEvaluacionPlanilla({
      asignacionId: 88,
      descripcion: "trabajo grupal",
      periodo: 3,
    })).resolves.toBe(respuesta);

    expect(apiMock.delete).toHaveBeenCalledWith(
      "/planilla/tipo?asignacion_id=88&descripcion=trabajo%20grupal&periodo=3",
    );
  });

  it("propaga señales de cancelación y errores sin reinterpretarlos", async () => {
    const controller = new AbortController();
    const error = new Error("Planilla no disponible");
    apiMock.get
      .mockResolvedValueOnce({ data: { columnas: [], data: [] } })
      .mockRejectedValueOnce(error);

    await obtenerPlanillaNotas(88, 3, { signal: controller.signal });
    await expect(listarClasesProfesorPlanilla(12)).rejects.toBe(error);

    expect(apiMock.get).toHaveBeenNthCalledWith(
      1,
      "/planilla-excel/88/3",
      { signal: controller.signal },
    );
  });
});

describe("contrato HTTP de las subnotas", () => {
  it("sin conSubnotas pide la planilla exactamente como siempre", async () => {
    apiMock.get.mockResolvedValue({ data: {} });

    await obtenerPlanillaNotas(88, 3);
    await obtenerPlanillaNotas(88, 3, { conSubnotas: false });

    expect(apiMock.get.mock.calls).toEqual([
      ["/planilla-excel/88/3"],
      ["/planilla-excel/88/3"],
    ]);
  });

  it("con conSubnotas agrega el parámetro sin cambiar la ruta y conserva la señal", async () => {
    const controller = new AbortController();
    const planilla = { columnas: [], data: [], subnotas: {} };
    apiMock.get.mockResolvedValue({ data: planilla });

    await expect(
      obtenerPlanillaNotas(88, 3, { signal: controller.signal, conSubnotas: true }),
    ).resolves.toBe(planilla);
    await obtenerPlanillaNotas(88, 3, { conSubnotas: true });

    expect(apiMock.get.mock.calls).toEqual([
      ["/planilla-excel/88/3", { signal: controller.signal, params: { con_subnotas: true } }],
      ["/planilla-excel/88/3", { params: { con_subnotas: true } }],
    ]);
  });

  it("crea, renombra y borra subnotas con las rutas del backend", async () => {
    const creada = { id: 7, tipo_nota: "Cognitivo", nombre: "Taller 1" };
    const renombrada = { id: 7, nombre: "Taller 2" };
    const borrada = { mensaje: "Subnota eliminada correctamente", calificaciones_borradas: 0, celdas: {} };
    apiMock.post.mockResolvedValue({ data: creada });
    apiMock.put.mockResolvedValue({ data: renombrada });
    apiMock.delete.mockResolvedValue({ data: borrada });
    const nueva = { asignacion_id: 88, periodo: 3, tipo_nota: "Cognitivo", nombre: "Taller 1" };
    const nombre = { asignacion_id: 88, nombre: "Taller 2" };

    await expect(crearSubnotaPlanilla(nueva)).resolves.toBe(creada);
    await expect(renombrarSubnotaPlanilla(7, nombre)).resolves.toBe(renombrada);
    await expect(eliminarSubnotaPlanilla({ subnotaId: 7, asignacionId: 88 })).resolves.toBe(borrada);

    expect(apiMock.post.mock.calls[0]).toEqual(["/planilla/subnotas", nueva, undefined]);
    expect(apiMock.post.mock.calls[0][1]).toBe(nueva);
    expect(apiMock.put.mock.calls[0]).toEqual(["/planilla/subnotas/7", nombre, undefined]);
    expect(apiMock.delete.mock.calls[0]).toEqual([
      "/planilla/subnotas/7?asignacion_id=88",
      undefined,
    ]);
  });

  it("guarda las calificaciones de un estudiante enviando el cuerpo sin alterarlo", async () => {
    const controller = new AbortController();
    const payload = {
      asignacion_id: 88,
      periodo: 3,
      tipo_nota: "Cognitivo",
      estudiante_id: 501,
      tipo_evaluacion: "numerica",
      valores: { 7: 4.5, 8: null },
    };
    const respuesta = { estudiante_id: 501, nota: 4.5, subnotas: { 7: 4.5 } };
    apiMock.post.mockResolvedValue({ data: respuesta });

    await expect(
      guardarCalificacionesSubnotas(payload, { signal: controller.signal }),
    ).resolves.toBe(respuesta);

    expect(apiMock.post.mock.calls[0]).toEqual([
      "/planilla/subnotas/valores",
      payload,
      { signal: controller.signal },
    ]);
    expect(apiMock.post.mock.calls[0][1]).toBe(payload);
  });

  it("propaga los errores del servidor sin reinterpretarlos", async () => {
    const error = Object.assign(new Error("409"), {
      response: { status: 409, data: { detail: "Ya existe una subnota con ese nombre en este tipo de nota." } },
    });
    apiMock.post.mockRejectedValue(error);

    await expect(crearSubnotaPlanilla({})).rejects.toBe(error);
    await expect(guardarCalificacionesSubnotas({})).rejects.toBe(error);
  });
});
