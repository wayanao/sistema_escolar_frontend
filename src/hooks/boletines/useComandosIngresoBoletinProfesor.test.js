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
    if (opciones?.title === "Aplicar logros al grupo") {
      return Promise.resolve({ isConfirmed: true, isDenied: false });
    }
    if (opciones?.title === "Guardar todo el grupo") {
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

  it("aplica logros solo a vacíos y marca únicamente estudiantes modificados", async () => {
    const { result } = renderHook(() =>
      useComandosIngresoBoletinProfesor(crearPropiedades()),
    );

    await act(async () => {
      await result.current.aplicarLogrosDelPrimerEstudiante();
    });

    expect(result.current.datosBoletin[102].observaciones[0].observacion).toBe(
      "Logro común",
    );
    expect(result.current.estadoGuardado[101].modificado).toBe(false);
    expect(result.current.estadoGuardado[102].modificado).toBe(true);
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

  it("guarda el grupo secuencialmente y conserva estados individuales", async () => {
    const orden = [];
    guardarBoletinMock.mockImplementation(async (payload) => {
      orden.push(payload.estudiante_id);
      return {};
    });
    const { result } = renderHook(() =>
      useComandosIngresoBoletinProfesor(crearPropiedades()),
    );

    await act(async () => {
      await result.current.guardarTodosBoletines();
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

    it("al guardar todo el grupo, el aviso va en la misma confirmación", async () => {
      const { result } = renderHook(() => useComandosIngresoBoletinProfesor(conIncompletos()));

      await act(async () => {
        await result.current.guardarTodosBoletines();
      });

      const confirmacion = swalFireMock.mock.calls.find(([opciones]) => opciones?.title === "Guardar todo el grupo")[0];
      expect(confirmacion.text).toContain("la definitiva es el promedio simple");
      expect(titulos()).not.toContain(AVISO);
      expect(guardarBoletinMock).toHaveBeenCalledTimes(2);

      // Ya aceptó: guardar uno después no vuelve a preguntar.
      await act(async () => {
        await result.current.guardarBoletinEstudiante(101);
      });
      expect(titulos()).not.toContain(AVISO);
    });
  });
});
