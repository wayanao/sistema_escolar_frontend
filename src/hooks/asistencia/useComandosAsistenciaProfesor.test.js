import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { guardarMock, swalFireMock, swalUpdateMock } = vi.hoisted(() => ({
  guardarMock: vi.fn(),
  swalFireMock: vi.fn(),
  swalUpdateMock: vi.fn(),
}));

vi.mock("../../services/asistenciaApi", () => ({
  guardarAsistenciaProfesor: guardarMock,
}));

// La espera pasa a éxito en la misma ventana y la cierra un reloj
// (ventanaExito.js): por eso hacen falta más partes de SweetAlert.
vi.mock("sweetalert2", () => ({
  default: {
    fire: swalFireMock,
    update: swalUpdateMock,
    getFooter: vi.fn(),
    getPopup: vi.fn(),
    isVisible: vi.fn(),
    close: vi.fn(),
  },
}));

import useComandosAsistenciaProfesor from "./useComandosAsistenciaProfesor";
import { opcionesExitoTrasEspera, opcionesVentanaEspera } from "../ventanaExito";

const EXITO_DOS_PRESENTES = {
  title: "Asistencia guardada",
  text: "2 presentes y 0 ausentes quedaron registrados correctamente.",
};

const estudiantes = [
  { estudiante_id: 101, nombre: "Ana" },
  { estudiante_id: 102, nombre: "Luis" },
];
const parametrosBase = {
  asignacionId: "44",
  periodo: "2",
  fecha: "2026-07-31",
  estudiantes,
  historial: [],
  historialListo: true,
  errorHistorial: "",
};

function diferido() {
  let resolve;
  const promise = new Promise((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  guardarMock.mockResolvedValue({});
  swalFireMock.mockResolvedValue({ isConfirmed: true });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useComandosAsistenciaProfesor", () => {
  it("hidrata una asistencia guardada, permite editarla y restaurarla", async () => {
    const historial = [
      {
        estudiante_id: 101,
        historial: [{ fecha: "2026-07-31T08:00:00", estado: "presente" }],
      },
      {
        estudiante_id: 102,
        historial: [{ fecha: "2026-07-31", estado: "ausente" }],
      },
    ];
    const { result } = renderHook(() => useComandosAsistenciaProfesor({
      ...parametrosBase,
      historial,
      recargarHistorial: vi.fn(),
    }));

    await waitFor(() => expect(result.current.asistencia).toEqual({
      101: "presente",
      102: "ausente",
    }));
    expect(result.current.asistenciaDelDiaTomada).toBe(true);
    expect(result.current.hayCambiosSinGuardar).toBe(false);

    act(() => result.current.marcar(101, "ausente"));
    expect(result.current.hayCambiosSinGuardar).toBe(true);

    act(() => result.current.restaurarSeleccion());
    expect(result.current.asistencia).toEqual({ 101: "presente", 102: "ausente" });
    expect(result.current.hayCambiosSinGuardar).toBe(false);
  });

  it("confirma antes de reemplazar ausencias con la marcación masiva", async () => {
    const { result } = renderHook(() => useComandosAsistenciaProfesor({
      ...parametrosBase,
      recargarHistorial: vi.fn(),
    }));

    act(() => result.current.marcar(101, "ausente"));
    await act(async () => result.current.marcarTodosPresentes());

    expect(swalFireMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "¿Marcar todos presentes?",
      confirmButtonText: "Sí, marcar todos",
      cancelButtonText: "Conservar marcación",
    }));
    expect(result.current.asistencia).toEqual({ 101: "presente", 102: "presente" });
    expect(result.current.puedeGuardar).toBe(true);
  });

  it("bloquea el guardado y avisa cuando quedan estudiantes pendientes", async () => {
    const { result } = renderHook(() => useComandosAsistenciaProfesor({
      ...parametrosBase,
      recargarHistorial: vi.fn(),
    }));

    await act(async () => result.current.guardarAsistencia());

    expect(swalFireMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Asistencia incompleta",
      text: "Falta marcar 2 estudiantes.",
    }));
    expect(guardarMock).not.toHaveBeenCalled();
  });

  it("guarda el payload actual, recarga el historial y confirma el éxito", async () => {
    const recargarHistorial = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useComandosAsistenciaProfesor({
      ...parametrosBase,
      recargarHistorial,
    }));

    await act(async () => result.current.marcarTodosPresentes());
    await act(async () => result.current.guardarAsistencia());

    expect(guardarMock).toHaveBeenCalledWith([
      {
        estudiante_id: 101,
        asignacion_id: 44,
        fecha: "2026-07-31",
        estado: "presente",
        periodo: 2,
      },
      {
        estudiante_id: 102,
        asignacion_id: 44,
        fecha: "2026-07-31",
        estado: "presente",
        periodo: 2,
      },
    ]);
    expect(recargarHistorial).toHaveBeenCalledTimes(1);
    expect(swalUpdateMock).toHaveBeenCalledWith(opcionesExitoTrasEspera(EXITO_DOS_PRESENTES));
    expect(result.current.guardando).toBe(false);
  });

  it("guarda enseguida: sin confirmar, la tarjeta sale al oprimir y el éxito no espera la recarga", async () => {
    const guardado = diferido();
    guardarMock.mockImplementation(() => guardado.promise);
    const recarga = diferido();
    const recargarHistorial = vi.fn(() => recarga.promise);
    const { result } = renderHook(() => useComandosAsistenciaProfesor({
      ...parametrosBase,
      recargarHistorial,
    }));
    await act(async () => result.current.marcarTodosPresentes());

    let comando;
    await act(async () => {
      comando = result.current.guardarAsistencia();
      await vi.waitFor(() => expect(guardarMock).toHaveBeenCalled());
    });
    // Lo primero que sale es la tarjeta de espera: ya no hay ventana de confirmar.
    expect(swalFireMock).toHaveBeenCalledTimes(1);
    expect(swalFireMock).toHaveBeenCalledWith(
      opcionesVentanaEspera({ title: "Guardando asistencia…" }),
    );

    await act(async () => {
      guardado.resolve({});
      await vi.waitFor(() => expect(recargarHistorial).toHaveBeenCalled());
    });
    // El éxito ya salió aunque la recarga siga en curso.
    expect(swalUpdateMock).toHaveBeenCalledWith(opcionesExitoTrasEspera(EXITO_DOS_PRESENTES));

    await act(async () => {
      recarga.resolve();
      await comando;
    });
    expect(result.current.guardando).toBe(false);
  });

  it("si falla recargar el historial, no dice que no se guardó", async () => {
    const recargarHistorial = vi.fn().mockRejectedValue(new Error("sin red"));
    const { result } = renderHook(() => useComandosAsistenciaProfesor({
      ...parametrosBase,
      recargarHistorial,
    }));

    await act(async () => result.current.marcarTodosPresentes());
    await act(async () => result.current.guardarAsistencia());

    expect(swalUpdateMock).toHaveBeenCalledWith(opcionesExitoTrasEspera(EXITO_DOS_PRESENTES));
    expect(swalFireMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "No se pudo guardar" }),
    );
    expect(result.current.guardando).toBe(false);
  });

  it("impide que dos comandos simultáneos dupliquen el envío", async () => {
    const guardado = diferido();
    guardarMock.mockImplementation(() => guardado.promise);
    const { result } = renderHook(() => useComandosAsistenciaProfesor({
      ...parametrosBase,
      recargarHistorial: vi.fn().mockResolvedValue(undefined),
    }));
    await act(async () => result.current.marcarTodosPresentes());

    let primerComando;
    await act(async () => {
      primerComando = result.current.guardarAsistencia();
      await result.current.guardarAsistencia();
    });
    await waitFor(() => expect(guardarMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      guardado.resolve({});
      await primerComando;
    });

    expect(guardarMock).toHaveBeenCalledTimes(1);
  });

  it("conserva el detalle del backend al informar un error de guardado", async () => {
    guardarMock.mockRejectedValue({
      response: { data: { detail: "La asistencia ya fue modificada." } },
    });
    const recargarHistorial = vi.fn();
    const { result } = renderHook(() => useComandosAsistenciaProfesor({
      ...parametrosBase,
      recargarHistorial,
    }));

    await act(async () => result.current.marcarTodosPresentes());
    await act(async () => result.current.guardarAsistencia());

    expect(swalFireMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "No se pudo guardar",
      text: "La asistencia ya fue modificada.",
    }));
    expect(recargarHistorial).not.toHaveBeenCalled();
    expect(result.current.guardando).toBe(false);
  });

  it("avisa y no recarga cuando el backend rechaza la asignación por nivel académico", async () => {
    // El backend responde 200 con {error} -no lanza- cuando un curso
    // preescolar intenta tomar asistencia por una materia normal en vez de
    // la asignación reservada "Asistencia diaria".
    guardarMock.mockResolvedValue({
      error: 'Este curso es de preescolar. Usa la asignación "Asistencia diaria" para registrar asistencia.',
    });
    const recargarHistorial = vi.fn();
    const { result } = renderHook(() => useComandosAsistenciaProfesor({
      ...parametrosBase,
      recargarHistorial,
    }));

    await act(async () => result.current.marcarTodosPresentes());
    await act(async () => result.current.guardarAsistencia());

    expect(swalFireMock).toHaveBeenCalledWith(expect.objectContaining({
      icon: "warning",
      title: "No se pudo guardar",
      text: 'Este curso es de preescolar. Usa la asignación "Asistencia diaria" para registrar asistencia.',
    }));
    expect(recargarHistorial).not.toHaveBeenCalled();
    expect(result.current.guardando).toBe(false);
  });
});
