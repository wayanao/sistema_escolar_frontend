import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

import {
  actualizarRevisionPlaneacionAdmin,
  crearObservacionPlaneacionAdmin,
  descargarImagenPlaneacion,
  eliminarImagenPlaneacionAdmin,
  eliminarImagenPlanProfesor,
  guardarPlanProfesor,
  listarClasesProfesor,
  listarHistorialPlanesProfesor,
  listarPlanesAnioAnterior,
  listarNotificacionesPlaneadores,
  listarObservacionesPlan,
  listarPlaneacionesAdmin,
  listarProfesoresPlaneaciones,
  marcarObservacionVista,
  obtenerPlanAnioAnterior,
  obtenerPlaneacionAdmin,
  obtenerPlanProfesor,
} from "./planeacionesApi";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contrato HTTP compartido de planeaciones", () => {
  it("consulta notificaciones conservando el límite recibido", async () => {
    const respuesta = {
      total_no_leidas: 2,
      total_profesores: 1,
      items: [{ id: 91 }],
    };
    apiMock.get.mockResolvedValue({ data: respuesta });

    await expect(listarNotificacionesPlaneadores(20)).resolves.toBe(respuesta);

    expect(apiMock.get).toHaveBeenCalledWith("/notificaciones/planeadores", {
      params: { limit: 20 },
    });
  });

  it("descarga imágenes protegidas como blob y devuelve los datos", async () => {
    const blob = new Blob(["imagen"], { type: "image/webp" });
    apiMock.get.mockResolvedValue({ data: blob });

    await expect(
      descargarImagenPlaneacion("/evidencias/plan-91.webp?version=3"),
    ).resolves.toBe(blob);

    expect(apiMock.get).toHaveBeenCalledWith(
      "/evidencias/plan-91.webp?version=3",
      { responseType: "blob" },
    );
  });
});

describe("contrato HTTP de planeaciones del profesor", () => {
  it("consulta clases, plan diario e historial con sus parámetros actuales", async () => {
    apiMock.get
      .mockResolvedValueOnce({ data: [{ id: 4 }] })
      .mockResolvedValueOnce({ data: { id: 9 } })
      .mockResolvedValueOnce({ data: [{ id: 9 }] });

    await expect(listarClasesProfesor(7)).resolves.toEqual([{ id: 4 }]);
    await expect(obtenerPlanProfesor(4, "2026-07-28")).resolves.toEqual({ id: 9 });
    await expect(
      listarHistorialPlanesProfesor(4, { limit: 4, offset: 3 }),
    ).resolves.toEqual([{ id: 9 }]);

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/mis-clases/7");
    expect(apiMock.get).toHaveBeenNthCalledWith(2, "/plan-de-clases/4", {
      params: { fecha: "2026-07-28" },
    });
    expect(apiMock.get).toHaveBeenNthCalledWith(3, "/plan-de-clases/4", {
      params: { limit: 4, offset: 3 },
    });
  });

  it("guarda multipart y elimina la imagen con el mismo contrato", async () => {
    const formData = new FormData();
    apiMock.post.mockResolvedValue({ data: { id: 9 } });
    apiMock.delete.mockResolvedValue({ data: { mensaje: "ok" } });

    await expect(guardarPlanProfesor(formData)).resolves.toEqual({ id: 9 });
    await expect(eliminarImagenPlanProfesor(9, "imagen1")).resolves.toEqual({
      mensaje: "ok",
    });

    expect(apiMock.post).toHaveBeenCalledWith("/plan-de-clases", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    expect(apiMock.delete).toHaveBeenCalledWith("/plan-de-clases/9/imagen", {
      params: { slot: "imagen1" },
    });
  });

  it("lista observaciones y confirma su lectura", async () => {
    apiMock.get.mockResolvedValue({ data: [{ id: 12 }] });
    apiMock.patch.mockResolvedValue({
      data: { vista_por_profesor_at: "2026-07-28T10:00:00Z" },
    });

    await expect(listarObservacionesPlan(9)).resolves.toEqual([{ id: 12 }]);
    await expect(marcarObservacionVista(9, 12)).resolves.toEqual({
      vista_por_profesor_at: "2026-07-28T10:00:00Z",
    });

    expect(apiMock.get).toHaveBeenCalledWith("/plan-de-clases/9/observaciones");
    expect(apiMock.patch).toHaveBeenCalledWith(
      "/plan-de-clases/9/observaciones/12/vista",
    );
  });
});

describe("contrato HTTP de planeaciones administrativas", () => {
  it("consulta profesores y bandeja conservando parámetros y señal", async () => {
    const controller = new AbortController();
    const params = { estado: "pendiente", limit: 12, offset: 0 };
    apiMock.get
      .mockResolvedValueOnce({ data: [{ id: 7 }] })
      .mockResolvedValueOnce({ data: { items: [], total: 0 } });

    await expect(listarProfesoresPlaneaciones()).resolves.toEqual([{ id: 7 }]);
    await expect(
      listarPlaneacionesAdmin(params, { signal: controller.signal }),
    ).resolves.toEqual({ items: [], total: 0 });

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/profesores");
    expect(apiMock.get).toHaveBeenNthCalledWith(2, "/admin/plan-de-clases", {
      params,
      signal: controller.signal,
    });
  });

  it("consulta el detalle y mantiene las rutas de revisión y observación", async () => {
    const revision = { estado: "revisado", version: 3, comentario: null };
    const observacion = { observacion: "Ajustar logro", version: 3 };
    apiMock.get.mockResolvedValue({ data: { id: 9 } });
    apiMock.patch.mockResolvedValue({ data: { estado_revision: "revisado" } });
    apiMock.post.mockResolvedValue({ data: { estado_revision: "observado" } });

    await expect(obtenerPlaneacionAdmin(9)).resolves.toEqual({ id: 9 });
    await expect(
      actualizarRevisionPlaneacionAdmin(9, revision),
    ).resolves.toEqual({ estado_revision: "revisado" });
    await expect(
      crearObservacionPlaneacionAdmin(9, observacion),
    ).resolves.toEqual({ estado_revision: "observado" });

    expect(apiMock.get).toHaveBeenCalledWith("/admin/plan-de-clases/9");
    expect(apiMock.patch).toHaveBeenCalledWith(
      "/admin/plan-de-clases/9/revision",
      revision,
    );
    expect(apiMock.post).toHaveBeenCalledWith(
      "/admin/plan-de-clases/9/observaciones",
      observacion,
    );
  });

  it("elimina evidencia administrativa y propaga los errores sin alterarlos", async () => {
    const requestError = { response: { status: 409 } };
    apiMock.delete.mockResolvedValueOnce({ data: { mensaje: "ok" } });
    apiMock.get.mockRejectedValueOnce(requestError);

    await expect(
      eliminarImagenPlaneacionAdmin(9, "imagen2"),
    ).resolves.toEqual({ mensaje: "ok" });
    expect(apiMock.delete).toHaveBeenCalledWith(
      "/admin/plan-de-clases/9/imagen",
      { params: { slot: "imagen2" } },
    );
    await expect(obtenerPlaneacionAdmin(9)).rejects.toBe(requestError);
  });
});

describe("bandeja del admin y el año lectivo (paso 4.6)", () => {
  it("con las opciones del año activo, los filtros viajan tal cual", async () => {
    const controller = new AbortController();
    const params = { estado_revision: "pendiente", limit: 12, offset: 0 };
    apiMock.get.mockResolvedValue({ data: { items: [], total: 0 } });

    await listarPlaneacionesAdmin(params, { signal: controller.signal });

    expect(apiMock.get).toHaveBeenCalledWith("/admin/plan-de-clases", {
      params,
      signal: controller.signal,
    });
    expect(apiMock.get.mock.calls[0][1].params).toBe(params);
  });

  it("mirando otro año, el año se suma a los filtros sin tocarlos", async () => {
    const controller = new AbortController();
    const params = { estado_revision: "pendiente", limit: 12, offset: 0 };
    apiMock.get.mockResolvedValue({ data: { items: [], total: 0 } });

    await listarPlaneacionesAdmin(params, {
      signal: controller.signal,
      parametrosAnio: { anio_lectivo_id: 3 },
    });

    expect(apiMock.get).toHaveBeenCalledWith("/admin/plan-de-clases", {
      params: { estado_revision: "pendiente", limit: 12, offset: 0, anio_lectivo_id: 3 },
      signal: controller.signal,
    });
    expect(params).toEqual({ estado_revision: "pendiente", limit: 12, offset: 0 });
  });
});

describe("planes del año pasado (año lectivo, paso 7.4)", () => {
  it("lista los planes del año pasado de la clase", async () => {
    const planes = [{ id: 1, fecha: "2026-02-10", periodo: 1, unidad: "Números", tema: "Conteo" }];
    apiMock.get.mockResolvedValue({ data: planes });

    await expect(listarPlanesAnioAnterior(200)).resolves.toBe(planes);
    expect(apiMock.get).toHaveBeenCalledWith("/plan-de-clases/200/anio-anterior");
  });

  it("pide el texto de un plan con la clase de este año y el id del plan", async () => {
    const texto = { id: 1, unidad: "Números", tema: "Conteo" };
    apiMock.get.mockResolvedValue({ data: texto });

    await expect(obtenerPlanAnioAnterior(200, 1)).resolves.toBe(texto);
    expect(apiMock.get).toHaveBeenCalledWith("/plan-de-clases/200/anio-anterior/1");
  });
});
