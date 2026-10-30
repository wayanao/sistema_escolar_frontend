import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

import {
  actualizarEstudiante,
  cambiarEstadoEstudiante,
  crearEstudiante,
  guardarObservacion,
  listarCursosEstudiantes,
  listarEstudiantes,
  listarPlanillaObservador,
  obtenerAdmisionDeEstudiante,
  obtenerDetalleEstudiante,
  obtenerDeudasEstudiante,
  obtenerEstudiante,
  obtenerObservacion,
} from "./estudiantesObservadorApi";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contrato HTTP de estudiantes y observador", () => {
  it("lista estudiantes con su estado y cursos sin reinterpretar respuestas", async () => {
    const estudiantes = [{ id: 12, estado: "activo" }];
    const cursos = [{ id: 4, nombre: "5A" }];
    apiMock.get
      .mockResolvedValueOnce({ data: estudiantes })
      .mockResolvedValueOnce({ data: cursos });

    await expect(listarEstudiantes("activo")).resolves.toBe(estudiantes);
    await expect(listarCursosEstudiantes()).resolves.toBe(cursos);

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/estudiantes", {
      params: { estado: "activo" },
    });
    expect(apiMock.get).toHaveBeenNthCalledWith(2, "/cursos");
  });

  it("conserva rutas y payloads de creación, edición y estado", async () => {
    const payload = { nombre: "Ana", email: null };
    apiMock.post.mockResolvedValue({ data: { id: 11 } });
    apiMock.put.mockResolvedValue({ data: { id: 11 } });
    apiMock.patch.mockResolvedValue({ data: { estado: "retirado" } });

    await crearEstudiante(payload);
    await actualizarEstudiante(11, payload);
    await cambiarEstadoEstudiante(11, "retirado");

    expect(apiMock.post).toHaveBeenCalledWith("/estudiantes", payload);
    expect(apiMock.put).toHaveBeenCalledWith("/estudiantes/11", payload);
    expect(apiMock.patch).toHaveBeenCalledWith("/estudiantes/11/estado", {
      estado: "retirado",
    });
  });

  it("consulta edición, detalle, deudas y planilla en las rutas vigentes", async () => {
    apiMock.get
      .mockResolvedValueOnce({ data: { id: 11 } })
      .mockResolvedValueOnce({ data: { promedio_general: 4 } })
      .mockResolvedValueOnce({ data: { total_deuda: 0 } })
      .mockResolvedValueOnce({ data: [{ estudiante_id: 11 }] });

    await obtenerEstudiante(11);
    await obtenerDetalleEstudiante(11);
    await obtenerDeudasEstudiante(11);
    await listarPlanillaObservador(44);

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/estudiantes/11");
    expect(apiMock.get).toHaveBeenNthCalledWith(
      2,
      "/estudiantes/11/detalles",
    );
    expect(apiMock.get).toHaveBeenNthCalledWith(3, "/estudiantes/11/deudas");
    expect(apiMock.get).toHaveBeenNthCalledWith(4, "/planilla/44");
  });

  it("con las opciones del año activo, las lecturas de la pantalla llaman a api como siempre", async () => {
    // Los hooks pasan `{}` mirando el año activo (`opcionesConAnio`).
    apiMock.get.mockResolvedValue({ data: [] });

    await listarEstudiantes("activo", {});
    await listarCursosEstudiantes({});
    await obtenerDetalleEstudiante(11, {});
    await obtenerDeudasEstudiante(11, {});

    expect(apiMock.get.mock.calls).toEqual([
      ["/estudiantes", { params: { estado: "activo" } }],
      ["/cursos"],
      ["/estudiantes/11/detalles"],
      ["/estudiantes/11/deudas"],
    ]);
  });

  it("mirando otro año, las cuatro lecturas llevan anio_lectivo_id", async () => {
    const parametrosAnio = { anio_lectivo_id: 2 };
    apiMock.get.mockResolvedValue({ data: [] });

    await listarEstudiantes("todos", { parametrosAnio });
    await listarCursosEstudiantes({ parametrosAnio });
    await obtenerDetalleEstudiante(11, { parametrosAnio });
    await obtenerDeudasEstudiante(11, { parametrosAnio });

    const conAnio = { params: { anio_lectivo_id: 2 } };
    expect(apiMock.get.mock.calls).toEqual([
      ["/estudiantes", { params: { estado: "todos", anio_lectivo_id: 2 } }],
      ["/cursos", conAnio],
      ["/estudiantes/11/detalles", conAnio],
      ["/estudiantes/11/deudas", conAnio],
    ]);
  });

  it("la lista de estudiantes lleva la señal solo si se la pasan", async () => {
    const controller = new AbortController();
    apiMock.get.mockResolvedValue({ data: [] });

    await listarEstudiantes("todos", {
      parametrosAnio: { anio_lectivo_id: 3 },
      signal: controller.signal,
    });

    expect(apiMock.get).toHaveBeenCalledWith("/estudiantes", {
      params: { estado: "todos", anio_lectivo_id: 3 },
      signal: controller.signal,
    });
  });

  it("propaga la señal en la consulta y conserva el payload del observador", async () => {
    const controller = new AbortController();
    const observacion = { conductual: "Avance" };
    const payload = {
      estudiante_id: 11,
      asignacion_id: 44,
      periodo: 2,
      conductual: "Avance",
      cognitivo: "",
      lenguaje: "",
    };
    apiMock.get.mockResolvedValue({ data: observacion });
    apiMock.post.mockResolvedValue({ data: { id: 91 } });

    await expect(
      obtenerObservacion(11, 44, 2, { signal: controller.signal }),
    ).resolves.toBe(observacion);
    await guardarObservacion(payload);

    expect(apiMock.get).toHaveBeenCalledWith("/observaciones/11/44/2", {
      signal: controller.signal,
    });
    expect(apiMock.post).toHaveBeenCalledWith("/observaciones", payload);
  });

  it("omite opciones si no hay señal y propaga los errores sin modificarlos", async () => {
    const error = new Error("Observación no disponible");
    apiMock.get
      .mockResolvedValueOnce({ data: null })
      .mockRejectedValueOnce(error);

    await obtenerObservacion(11, 44, 2);
    await expect(obtenerDeudasEstudiante(11)).rejects.toBe(error);

    expect(apiMock.get).toHaveBeenNthCalledWith(
      1,
      "/observaciones/11/44/2",
    );
  });

  it("pide las respuestas de la entrevista de admisión del estudiante (paso E11b)", async () => {
    const admision = { admision_id: 7, anio: 2027, cuestionario: {} };
    apiMock.get.mockResolvedValue({ data: admision });

    await expect(obtenerAdmisionDeEstudiante(11)).resolves.toBe(admision);

    expect(apiMock.get).toHaveBeenCalledWith("/estudiantes/11/admision");
  });
});
