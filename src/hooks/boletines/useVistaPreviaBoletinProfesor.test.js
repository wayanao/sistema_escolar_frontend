import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerReferenciaMock } = vi.hoisted(() => ({
  obtenerReferenciaMock: vi.fn(),
}));

vi.mock("../../services/boletinesApi", () => ({
  obtenerReferenciaBoletin: obtenerReferenciaMock,
}));

import useVistaPreviaBoletinProfesor from "./useVistaPreviaBoletinProfesor";

const nota = (tipo_nota, valor) => ({ tipo_nota, tipo_evaluacion: "numerica", valor });
const observacion = (referencia, nota, texto) => ({
  nota,
  observacion: texto,
  referencia,
  tipo_evaluacion: "numerica",
  valoracion: "",
});

const estudiantes = [
  { estudiante_id: 101, nombre: "Ana Pérez", notas: [nota("lectura", 4.5)] },
  // Sin formulario que corresponda: la pantalla no lo muestra, la vista previa tampoco.
  { estudiante_id: 102, nombre: "Oculto", notas: [nota("lectura", 3)] },
  { estudiante_id: 103, nombre: "Bruno Gil", notas: [nota("lectura", 3.5)] },
];
const datosBoletin = {
  101: { definitiva: "4.50", observaciones: [observacion("lectura", 4.5, "Lee con fluidez")] },
  103: { definitiva: "3.50", observaciones: [observacion("lectura", 3.5, "")] },
};
const props = {
  asignacionId: "55",
  periodo: "2",
  clases: [{ id: 55, curso: "QUINTO", materia: "LENGUAJE" }],
  estudiantes,
  datosBoletin,
  estadoGuardado: {
    101: { guardado: true, modificado: false },
    103: { guardado: false, modificado: false },
  },
};

describe("useVistaPreviaBoletinProfesor", () => {
  beforeEach(() => {
    localStorage.setItem("profesor", JSON.stringify({ id: 9, nombre: "Lina Torres" }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("arranca cerrada y abre el estudiante pedido con su materia y la clase", () => {
    const { result } = renderHook(() => useVistaPreviaBoletinProfesor(props));
    expect(result.current.vistaPrevia).toBeNull();

    act(() => result.current.abrirVistaPrevia(101));

    expect(result.current.vistaPrevia).toMatchObject({
      estudianteId: 101,
      nombre: "Ana Pérez",
      curso: "QUINTO",
      periodo: "2",
      posicion: 1,
      total: 2,
      hayAnterior: false,
      haySiguiente: true,
      pendienteDeGuardar: false,
      materia: {
        materia: "LENGUAJE",
        profesor_nombre: "Lina Torres",
        definitiva: 4.5,
        detalles: [
          expect.objectContaining({
            observacion: "Lee con fluidez",
            notas_por_periodo: { 2: 4.5 },
          }),
        ],
      },
    });
  });

  it("pasa al siguiente y al anterior saltando a quien la pantalla no muestra", () => {
    const { result } = renderHook(() => useVistaPreviaBoletinProfesor(props));
    act(() => result.current.abrirVistaPrevia(101));

    act(() => result.current.verSiguiente());
    expect(result.current.vistaPrevia).toMatchObject({
      estudianteId: 103,
      posicion: 2,
      hayAnterior: true,
      haySiguiente: false,
      pendienteDeGuardar: true,
    });

    // En el último, "Siguiente" no hace nada.
    act(() => result.current.verSiguiente());
    expect(result.current.vistaPrevia.estudianteId).toBe(103);

    act(() => result.current.verAnterior());
    expect(result.current.vistaPrevia.estudianteId).toBe(101);
  });

  it("muestra lo escrito al instante, aunque no esté guardado", () => {
    const { result, rerender } = renderHook((p) => useVistaPreviaBoletinProfesor(p), {
      initialProps: props,
    });
    act(() => result.current.abrirVistaPrevia(103));

    rerender({
      ...props,
      datosBoletin: {
        ...datosBoletin,
        103: { definitiva: "3.50", observaciones: [observacion("lectura", 3.5, "Mejora su lectura")] },
      },
      estadoGuardado: { ...props.estadoGuardado, 103: { guardado: false, modificado: true } },
    });

    expect(result.current.vistaPrevia.materia.detalles[0].observacion).toBe("Mejora su lectura");
    expect(result.current.vistaPrevia.pendienteDeGuardar).toBe(true);
  });

  it("se cierra con Cerrar y al cambiar de clase o de periodo", () => {
    const { result, rerender } = renderHook((p) => useVistaPreviaBoletinProfesor(p), {
      initialProps: props,
    });

    act(() => result.current.abrirVistaPrevia(101));
    act(() => result.current.cerrarVistaPrevia());
    expect(result.current.vistaPrevia).toBeNull();

    act(() => result.current.abrirVistaPrevia(101));
    rerender({ ...props, periodo: "3" });
    expect(result.current.vistaPrevia).toBeNull();

    act(() => result.current.abrirVistaPrevia(101));
    rerender({ ...props, periodo: "3", asignacionId: "56" });
    expect(result.current.vistaPrevia).toBeNull();
  });

  it("sin sesión de profesor legible, el docente queda vacío", () => {
    localStorage.setItem("profesor", "{no es json");
    const { result } = renderHook(() => useVistaPreviaBoletinProfesor(props));
    act(() => result.current.abrirVistaPrevia(101));
    expect(result.current.vistaPrevia.materia.profesor_nombre).toBe("");
  });

  it("abierta bloquea el desplazamiento de atrás y Escape la cierra", () => {
    document.body.style.overflow = "";
    const { result, unmount } = renderHook(() => useVistaPreviaBoletinProfesor(props));

    act(() => result.current.abrirVistaPrevia(101));
    expect(document.body.style.overflow).toBe("hidden");

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.vistaPrevia).toBeNull();
    expect(document.body.style.overflow).toBe("");

    // Cerrada, Escape no hace nada; y al salir de la página tampoco queda bloqueada.
    act(() => result.current.abrirVistaPrevia(101));
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  describe("con otras materias del profesor en el mismo curso", () => {
    const clasesDelProfesor = [
      { id: 55, curso: "QUINTO A", curso_id: 5, materia: "LENGUAJE" },
      { id: 58, curso: "QUINTO A", curso_id: 5, materia: "INGLÉS" },
      { id: 60, curso: "SEXTO A", curso_id: 6, materia: "CIENCIAS" },
      { id: 56, curso: "QUINTO A", curso_id: 5, materia: "CIENCIAS" },
    ];
    const conOtras = { ...props, clases: clasesDelProfesor };

    beforeEach(() => {
      obtenerReferenciaMock.mockReset();
      obtenerReferenciaMock.mockImplementation((id) =>
        Promise.resolve(
          id === 56
            ? [
                {
                  estudiante_id: 101,
                  nombre: "Ana Pérez",
                  notas: [{ tipo_nota: "experimento", tipo_evaluacion: "numerica", valor: 3.8, observacion_guardada: "Formula hipótesis" }],
                },
                {
                  estudiante_id: 103,
                  nombre: "Bruno Gil",
                  notas: [{ tipo_nota: "experimento", tipo_evaluacion: "numerica", valor: 3, observacion_guardada: "" }],
                },
              ]
            : [],
        ),
      );
    });

    it("consulta solo las del mismo curso al abrir y arma cada una para el estudiante", async () => {
      const { result } = renderHook(() => useVistaPreviaBoletinProfesor(conOtras));
      expect(obtenerReferenciaMock).not.toHaveBeenCalled();

      act(() => result.current.abrirVistaPrevia(101));
      expect(result.current.vistaPrevia).toMatchObject({
        tieneOtrasMaterias: true,
        cargandoOtrasMaterias: true,
      });

      await waitFor(() => expect(result.current.vistaPrevia.cargandoOtrasMaterias).toBe(false));
      expect(obtenerReferenciaMock.mock.calls.map(([id, periodo]) => [id, periodo])).toEqual([
        [56, "2"],
        [58, "2"],
      ]);

      const otras = result.current.vistaPrevia.otrasMaterias;
      expect(otras.map((otra) => [otra.nombre, otra.guardada, otra.error])).toEqual([
        ["CIENCIAS", true, false],
        // Ana no aparece en esa clase: la materia queda pendiente, como en el boletín.
        ["INGLÉS", false, false],
      ]);
      expect(otras[0].materia).toMatchObject({
        materia: "CIENCIAS",
        profesor_nombre: "Lina Torres",
        detalles: [expect.objectContaining({ observacion: "Formula hipótesis" })],
      });
      expect(otras[1].materia.detalles).toEqual([]);
    });

    it("al pasar al siguiente estudiante no vuelve a consultar", async () => {
      const { result } = renderHook(() => useVistaPreviaBoletinProfesor(conOtras));
      act(() => result.current.abrirVistaPrevia(101));
      await waitFor(() => expect(result.current.vistaPrevia.cargandoOtrasMaterias).toBe(false));

      act(() => result.current.verSiguiente());
      expect(result.current.vistaPrevia.estudianteId).toBe(103);
      expect(result.current.vistaPrevia.otrasMaterias[0]).toMatchObject({
        nombre: "CIENCIAS",
        guardada: false,
      });
      expect(obtenerReferenciaMock).toHaveBeenCalledTimes(2);
    });

    it("una materia que falla queda marcada con error", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      obtenerReferenciaMock.mockImplementation((id) =>
        id === 58 ? Promise.reject(new Error("sin red")) : Promise.resolve([]),
      );
      const { result } = renderHook(() => useVistaPreviaBoletinProfesor(conOtras));
      act(() => result.current.abrirVistaPrevia(101));

      await waitFor(() => expect(result.current.vistaPrevia.cargandoOtrasMaterias).toBe(false));
      expect(result.current.vistaPrevia.otrasMaterias[1]).toEqual({
        clave: "58",
        nombre: "INGLÉS",
        error: true,
        guardada: false,
        materia: null,
      });
    });

    it("si solo dicta esa materia en el curso, no hay otras", () => {
      const { result } = renderHook(() => useVistaPreviaBoletinProfesor(props));
      act(() => result.current.abrirVistaPrevia(101));
      expect(result.current.vistaPrevia).toMatchObject({
        tieneOtrasMaterias: false,
        cargandoOtrasMaterias: false,
        otrasMaterias: [],
      });
      expect(obtenerReferenciaMock).not.toHaveBeenCalled();
    });
  });
});
