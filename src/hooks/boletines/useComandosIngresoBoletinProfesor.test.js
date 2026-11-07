import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { guardarBoletinMock, swalFireMock } = vi.hoisted(() => ({
  guardarBoletinMock: vi.fn(),
  swalFireMock: vi.fn(),
}));

vi.mock("../../services/boletinesApi", () => ({
  guardarBoletinProfesor: guardarBoletinMock,
}));

vi.mock("sweetalert2", () => ({
  default: { fire: swalFireMock },
}));

import useComandosIngresoBoletinProfesor from "./useComandosIngresoBoletinProfesor";

const estudiantes = [
  { estudiante_id: 101, nombre: "Ana" },
  { estudiante_id: 102, nombre: "Bruno" },
];
const datosIniciales = {
  101: {
    definitiva: "4.00",
    observaciones: [
      {
        nota: 4,
        observacion: "Logro común",
        referencia: "logro_1",
        tipo_evaluacion: "numerica",
        valoracion: "",
      },
    ],
  },
  102: {
    definitiva: "3.00",
    observaciones: [
      {
        nota: 3,
        observacion: "",
        referencia: "logro_1",
        tipo_evaluacion: "numerica",
        valoracion: "",
      },
    ],
  },
};
const estadoGuardadoInicial = {
  101: { guardado: true, modificado: false, guardadoEn: null },
  102: { guardado: false, modificado: false, guardadoEn: null },
};

const crearPropiedades = () => ({
  asignacionId: "55",
  periodo: "1",
  estudiantes,
  datosIniciales,
  estadoGuardadoInicial,
});

beforeEach(() => {
  vi.clearAllMocks();
  guardarBoletinMock.mockResolvedValue({});
  swalFireMock.mockImplementation((opciones) => {
    if (opciones?.title === "Copiar a todos y guardar") {
      return Promise.resolve({ isConfirmed: true });
    }
    return Promise.resolve({});
  });
});

describe("useComandosIngresoBoletinProfesor", () => {
  it("edita una observación y actualiza su estado visual", () => {
    const { result } = renderHook(() =>
      useComandosIngresoBoletinProfesor(crearPropiedades()),
    );

    act(() => result.current.actualizarObservacion(102, 0, "Caso individual"));

    expect(result.current.datosBoletin[102].observaciones[0].observacion).toBe(
      "Caso individual",
    );
    expect(result.current.estadoGuardado[102].modificado).toBe(true);
    expect(result.current.obtenerEstadoVisual(102).buttonText).toBe(
      "Guardar cambios",
    );
  });

  describe("Copiar a todos y guardar", () => {
    const textos = (result) =>
      Object.fromEntries(
        Object.entries(result.current.datosBoletin).map(([id, form]) => [id, form.observaciones[0].observacion]),
      );
    const enviados = () =>
      guardarBoletinMock.mock.calls.map(([payload]) => [payload.estudiante_id, payload.detalles[0].observacion]);

    it("llena los vacíos con los logros del primero y guarda todo el grupo con una sola confirmación", async () => {
      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(crearPropiedades()));

      await act(async () => {
        await result.current.copiarLogrosYGuardar();
      });

      const confirmaciones = swalFireMock.mock.calls.filter(([o]) => o?.showCancelButton);
      expect(confirmaciones).toHaveLength(1);
      expect(confirmaciones[0][0]).toMatchObject({
        title: "Copiar a todos y guardar",
        text: "Los logros de Ana se copiarán a un estudiante. Después se guarda todo el grupo (2 estudiantes).",
        confirmButtonText: "Copiar y guardar",
      });
      expect(textos(result)).toEqual({ 101: "Logro común", 102: "Logro común" });
      expect(enviados()).toEqual([[101, "Logro común"], [102, "Logro común"]]);
      await waitFor(() => expect(result.current.guardandoTodos).toBe(false));
      expect(result.current.estadoGuardado[102]).toMatchObject({ guardado: true, modificado: false });
    });

    it("una corrección en el primero llega a las copias y respeta lo escrito a mano", async () => {
      const tres = {
        ...crearPropiedades(),
        estudiantes: [...estudiantes, { estudiante_id: 103, nombre: "Carla" }],
        datosIniciales: {
          ...datosIniciales,
          102: { ...datosIniciales[102], observaciones: [{ ...datosIniciales[102].observaciones[0], observacion: "Logro común" }] },
          103: { ...datosIniciales[102], observaciones: [{ ...datosIniciales[102].observaciones[0], observacion: "Propio de Carla" }] },
        },
        estadoGuardadoInicial: {
          ...estadoGuardadoInicial,
          102: { guardado: true, modificado: false, guardadoEn: null },
          103: { guardado: true, modificado: false, guardadoEn: null },
        },
      };
      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(tres));

      act(() => result.current.actualizarObservacion(101, 0, "Logro común corregido"));
      await act(async () => {
        await result.current.copiarLogrosYGuardar();
      });

      expect(swalFireMock.mock.calls.find(([o]) => o?.title === "Copiar a todos y guardar")[0].text).toBe(
        "Los logros de Ana se copiarán a un estudiante. Lo que escribiste a mano para un estudiante no se toca. Después se guarda todo el grupo (3 estudiantes).",
      );
      expect(textos(result)).toEqual({
        101: "Logro común corregido",
        102: "Logro común corregido",
        103: "Propio de Carla",
      });

      // Ya guardado, una segunda corrección también llega a la copia.
      guardarBoletinMock.mockClear();
      act(() => result.current.actualizarObservacion(101, 0, "Tercera versión"));
      await act(async () => {
        await result.current.copiarLogrosYGuardar();
      });
      expect(enviados()).toEqual([
        [101, "Tercera versión"],
        [102, "Tercera versión"],
        [103, "Propio de Carla"],
      ]);
    });

    it("si cancela, no copia ni guarda", async () => {
      swalFireMock.mockResolvedValue({ isConfirmed: false });
      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(crearPropiedades()));

      await act(async () => {
        await result.current.copiarLogrosYGuardar();
      });

      expect(textos(result)[102]).toBe("");
      expect(guardarBoletinMock).not.toHaveBeenCalled();
      expect(result.current.estadoGuardado[102].modificado).toBe(false);
    });

    it("sin logros en el primero lo dice y no guarda", async () => {
      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(crearPropiedades()));
      act(() => result.current.actualizarObservacion(101, 0, "   "));

      await act(async () => {
        await result.current.copiarLogrosYGuardar();
      });

      expect(swalFireMock.mock.calls.at(-1)[0]).toMatchObject({
        title: "Sin logros para copiar",
        text: "Escribe al menos un logro en Ana para copiarlo a los demás.",
      });
      expect(guardarBoletinMock).not.toHaveBeenCalled();
    });
  });

  it("guarda un estudiante con el payload actual y actualiza su estado", async () => {
    const { result } = renderHook(() =>
      useComandosIngresoBoletinProfesor(crearPropiedades()),
    );

    await act(async () => {
      await result.current.guardarBoletinEstudiante(101);
    });

    expect(guardarBoletinMock).toHaveBeenCalledWith({
      estudiante_id: 101,
      asignacion_id: 55,
      periodo: 1,
      definitiva: 4,
      detalles: [
        {
          nota: 4,
          observacion: "Logro común",
          tipo_evaluacion: "numerica",
          valoracion: null,
        },
      ],
    });
    expect(result.current.estadoGuardado[101]).toEqual({
      guardado: true,
      modificado: false,
      guardadoEn: expect.any(String),
    });
  });

  it("Copiar a todos y guardar guarda el grupo uno por uno, en orden", async () => {
    const orden = [];
    guardarBoletinMock.mockImplementation(async (payload) => {
      orden.push(payload.estudiante_id);
      return {};
    });
    const { result } = renderHook(() =>
      useComandosIngresoBoletinProfesor(crearPropiedades()),
    );

    await act(async () => {
      await result.current.copiarLogrosYGuardar();
    });

    expect(orden).toEqual([101, 102]);
    expect(guardarBoletinMock).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(result.current.guardandoTodos).toBe(false));
    expect(result.current.estadoGuardado[101].guardado).toBe(true);
    expect(result.current.estadoGuardado[102].guardado).toBe(true);
  });

  // Porcentajes por tipo de nota, paso B4c (PB11 de
  // docs/funcionalidades/SUBNOTAS_PLANILLA.md del backend).
  describe("con porcentajes incompletos", () => {
    const AVISO = "Porcentajes incompletos";
    const conIncompletos = () => ({ ...crearPropiedades(), porcentajesIncompletos: true });
    const titulos = () => swalFireMock.mock.calls.map(([opciones]) => opciones?.title);

    it("sin porcentajes incompletos no pregunta nada de más", async () => {
      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(crearPropiedades()));

      await act(async () => {
        await result.current.guardarBoletinEstudiante(101);
      });

      expect(titulos()).not.toContain(AVISO);
      expect(guardarBoletinMock).toHaveBeenCalledTimes(1);
    });

    it("pregunta antes de guardar y, si se cancela, no guarda", async () => {
      swalFireMock.mockImplementation(async (opciones) =>
        opciones?.title === AVISO ? { isConfirmed: false } : {},
      );
      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(conIncompletos()));

      await act(async () => {
        await result.current.guardarBoletinEstudiante(101);
      });

      expect(swalFireMock).toHaveBeenCalledWith(expect.objectContaining({
        title: AVISO,
        text: "Los porcentajes de esta clase están incompletos: la definitiva es el promedio simple. ¿Guardar igual?",
        showCancelButton: true,
        confirmButtonText: "Guardar igual",
      }));
      expect(guardarBoletinMock).not.toHaveBeenCalled();
    });

    it("si acepta, guarda y no vuelve a preguntar en esa clase y periodo", async () => {
      swalFireMock.mockImplementation(async (opciones) =>
        opciones?.title === AVISO ? { isConfirmed: true } : {},
      );
      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(conIncompletos()));

      await act(async () => {
        await result.current.guardarBoletinEstudiante(101);
      });
      await act(async () => {
        await result.current.guardarBoletinEstudiante(102);
      });

      expect(guardarBoletinMock).toHaveBeenCalledTimes(2);
      expect(titulos().filter((titulo) => titulo === AVISO)).toHaveLength(1);
    });

    it("al copiar a todos y guardar, el aviso va en la misma confirmación", async () => {
      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(conIncompletos()));

      await act(async () => {
        await result.current.copiarLogrosYGuardar();
      });

      const confirmacion = swalFireMock.mock.calls.find(([opciones]) => opciones?.title === "Copiar a todos y guardar")[0];
      expect(confirmacion.text).toContain("la definitiva es el promedio simple");
      expect(confirmacion.icon).toBe("warning");
      expect(titulos()).not.toContain(AVISO);
      expect(guardarBoletinMock).toHaveBeenCalledTimes(2);

      // Ya aceptó: guardar uno después no vuelve a preguntar.
      await act(async () => {
        await result.current.guardarBoletinEstudiante(101);
      });
      expect(titulos()).not.toContain(AVISO);
    });
  });

  describe("que no se pierda lo escrito", () => {
    const titulos = () => swalFireMock.mock.calls.map(([opciones]) => opciones?.title);

    it("sin cambios pendientes deja cambiar de clase o periodo sin preguntar", async () => {
      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(crearPropiedades()));

      let puede;
      await act(async () => {
        puede = await result.current.confirmarDescartarCambios();
      });

      expect(puede).toBe(true);
      expect(swalFireMock).not.toHaveBeenCalled();
    });

    it("con cambios pendientes pregunta cuántos se pierden y respeta Quedarme", async () => {
      swalFireMock.mockResolvedValue({ isConfirmed: false });
      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(crearPropiedades()));
      act(() => result.current.actualizarObservacion(101, 0, "Nuevo texto"));
      act(() => result.current.actualizarObservacion(102, 0, "Otro texto"));

      let puede;
      await act(async () => {
        puede = await result.current.confirmarDescartarCambios();
      });

      expect(puede).toBe(false);
      const [opciones] = swalFireMock.mock.calls.at(-1);
      expect(opciones).toMatchObject({
        title: "Tienes cambios sin guardar",
        text: "2 estudiantes tienen cambios sin guardar. Si cambias de clase o de periodo, se pierden.",
        confirmButtonText: "Cambiar sin guardar",
        cancelButtonText: "Quedarme",
        focusCancel: true,
      });

      swalFireMock.mockResolvedValue({ isConfirmed: true });
      await act(async () => {
        puede = await result.current.confirmarDescartarCambios();
      });
      expect(puede).toBe(true);
    });

    it("después de guardar ya no pregunta", async () => {
      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(crearPropiedades()));
      act(() => result.current.actualizarObservacion(101, 0, "Nuevo texto"));
      await act(async () => {
        await result.current.guardarBoletinEstudiante(101);
      });
      swalFireMock.mockClear();

      let puede;
      await act(async () => {
        puede = await result.current.confirmarDescartarCambios();
      });
      expect(puede).toBe(true);
      expect(titulos()).not.toContain("Tienes cambios sin guardar");
    });

    it("con cambios pendientes, recargar o cerrar la pestaña pide confirmación al navegador", async () => {
      const { result, unmount } = renderHook(() =>
        useComandosIngresoBoletinProfesor(crearPropiedades()),
      );
      const intentarSalir = () => {
        const evento = new Event("beforeunload", { cancelable: true });
        window.dispatchEvent(evento);
        return evento.defaultPrevented;
      };

      expect(intentarSalir()).toBe(false);
      act(() => result.current.actualizarObservacion(101, 0, "Nuevo texto"));
      expect(intentarSalir()).toBe(true);

      await act(async () => {
        await result.current.guardarBoletinEstudiante(101);
      });
      expect(intentarSalir()).toBe(false);

      act(() => result.current.actualizarObservacion(101, 0, "Otra vez"));
      unmount();
      expect(intentarSalir()).toBe(false);
    });

    it("si guardar el grupo se detiene a la mitad, marca a los guardados y dice cuántos faltan", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      guardarBoletinMock
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error("sin red"));
      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(crearPropiedades()));
      act(() => result.current.actualizarObservacion(101, 0, "Nuevo texto"));
      act(() => result.current.actualizarObservacion(102, 0, "Otro texto"));

      await act(async () => {
        await result.current.copiarLogrosYGuardar();
      });

      expect(result.current.estadoGuardado[101]).toMatchObject({ guardado: true, modificado: false });
      expect(result.current.estadoGuardado[102].modificado).toBe(true);
      expect(result.current.guardandoTodos).toBe(false);
      const [aviso] = swalFireMock.mock.calls.at(-1);
      expect(aviso).toMatchObject({
        icon: "error",
        title: "Grupo guardado a medias",
        text: "Se guardaron 1 de 2 estudiantes. Falta Bruno: sigue marcado como no guardado. Revisa la conexión y vuelve a oprimir «Copiar a todos y guardar».",
      });
    });
  });

  describe("con borrador", () => {
    const CLAVE = "borrador_boletin:tenant_demo:7:55:1";
    const conBorrador = () => ({ ...crearPropiedades(), cargadoPara: { asignacionId: "55", periodo: "1" } });
    const leerBorrador = () => JSON.parse(localStorage.getItem(CLAVE) || "null");

    beforeEach(() => {
      localStorage.clear();
      localStorage.setItem("profesor", JSON.stringify({ id: 7, tenant: "tenant_demo" }));
    });

    it("lo escrito va al borrador y al guardar sale de él", async () => {
      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(conBorrador()));
      expect(leerBorrador()).toBeNull();

      act(() => result.current.actualizarObservacion(102, 0, "Escrito sin guardar"));
      expect(leerBorrador()).toMatchObject({
        actualizado: expect.any(String),
        estudiantes: {
          102: { observaciones: [{ referencia: "logro_1", observacion: "Escrito sin guardar" }] },
        },
      });

      await act(async () => {
        await result.current.guardarBoletinEstudiante(102);
      });
      expect(leerBorrador()).toBeNull();
    });

    it("al volver, encuentra el borrador y lo marca como no guardado", () => {
      localStorage.setItem(
        CLAVE,
        JSON.stringify({
          actualizado: "2026-11-07T15:30:00.000Z",
          estudiantes: {
            102: { observaciones: [{ referencia: "logro_1", tipo_evaluacion: "numerica", observacion: "Lo de antes" }] },
          },
        }),
      );

      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(conBorrador()));

      expect(result.current.datosBoletin[102].observaciones[0].observacion).toBe("Lo de antes");
      expect(result.current.estadoGuardado[102].modificado).toBe(true);
      expect(result.current.borradorRecuperado).toEqual({
        cantidad: 1,
        actualizado: "2026-11-07T15:30:00.000Z",
      });
      // Cargar el borrador no lo reescribe.
      expect(leerBorrador().actualizado).toBe("2026-11-07T15:30:00.000Z");
    });

    it("no se pierde nada: no pregunta al cambiar de clase ni al cerrar la pestaña", async () => {
      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(conBorrador()));
      act(() => result.current.actualizarObservacion(101, 0, "Nuevo"));

      let puede;
      await act(async () => {
        puede = await result.current.confirmarDescartarCambios();
      });
      expect(puede).toBe(true);
      expect(swalFireMock).not.toHaveBeenCalled();

      const evento = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(evento);
      expect(evento.defaultPrevented).toBe(false);
    });

    it("Descartar pregunta, borra el borrador y vuelve a lo guardado", async () => {
      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(conBorrador()));
      act(() => result.current.actualizarObservacion(101, 0, "Nuevo"));

      swalFireMock.mockResolvedValueOnce({ isConfirmed: false });
      await act(async () => {
        await result.current.descartarBorrador();
      });
      expect(result.current.datosBoletin[101].observaciones[0].observacion).toBe("Nuevo");
      expect(leerBorrador()).not.toBeNull();

      swalFireMock.mockResolvedValueOnce({ isConfirmed: true });
      await act(async () => {
        await result.current.descartarBorrador();
      });
      expect(swalFireMock.mock.calls.at(-1)[0]).toMatchObject({
        title: "Descartar lo que no has guardado",
        text: "Se borra lo que no has guardado de un estudiante y vuelve lo último guardado.",
      });
      expect(result.current.datosBoletin[101].observaciones[0].observacion).toBe("Logro común");
      expect(result.current.estadoGuardado[101].modificado).toBe(false);
      expect(result.current.borradorRecuperado).toBeNull();
      expect(leerBorrador()).toBeNull();
    });

    it("si el navegador no deja guardar, vuelve a preguntar antes de perder lo escrito", async () => {
      const original = Storage.prototype.setItem;
      const espia = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (clave, valor) {
        if (String(clave).includes("borrador")) throw new Error("QuotaExceededError");
        return original.call(this, clave, valor);
      });
      try {
        swalFireMock.mockResolvedValue({ isConfirmed: false });
        const { result } = renderHook(() => useComandosIngresoBoletinProfesor(conBorrador()));
        act(() => result.current.actualizarObservacion(101, 0, "Nuevo"));

        let puede;
        await act(async () => {
          puede = await result.current.confirmarDescartarCambios();
        });
        expect(puede).toBe(false);
        expect(swalFireMock.mock.calls.at(-1)[0].title).toBe("Tienes cambios sin guardar");
      } finally {
        espia.mockRestore();
      }
    });
  });

  it("al guardar el grupo cuenta cuántos van, y al terminar se quita el avance", async () => {
    const pendientes = [];
    guardarBoletinMock.mockImplementation(() => new Promise((resolve) => pendientes.push(resolve)));
    const { result } = renderHook(() => useComandosIngresoBoletinProfesor(crearPropiedades()));
    expect(result.current.progresoGrupo).toBeNull();

    let guardado;
    await act(async () => {
      guardado = result.current.copiarLogrosYGuardar();
    });
    await waitFor(() => expect(result.current.progresoGrupo).toEqual({ guardados: 0, total: 2 }));

    await act(async () => {
      pendientes[0]({});
    });
    await waitFor(() => expect(result.current.progresoGrupo).toEqual({ guardados: 1, total: 2 }));

    await act(async () => {
      pendientes[1]({});
      await guardado;
    });
    expect(result.current.progresoGrupo).toBeNull();
    expect(result.current.guardandoTodos).toBe(false);
  });
});
