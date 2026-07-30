import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearClaveCamposRecordados } from "../../utils/planeaciones/profesor";
import useFormularioPlaneacionProfesor from "./useFormularioPlaneacionProfesor";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("periodo", "2");
  window.alert = vi.fn();
});

describe("useFormularioPlaneacionProfesor", () => {
  it("marca cambios en campos y periodo sin alterar el resto del formulario", () => {
    const { result } = renderHook(() =>
      useFormularioPlaneacionProfesor({
        profesorId: 7,
        asignacionId: 44,
        fechaInicial: "2026-07-28",
      }),
    );

    act(() => {
      result.current.actualizarCampo("tema", "Fracciones");
      result.current.actualizarPeriodo("3");
    });

    expect(result.current.form.tema).toBe("Fracciones");
    expect(result.current.form.unidad).toBe("");
    expect(result.current.periodo).toBe("3");
    expect(result.current.estadoGuardado.modificado).toBe(true);
  });

  it("carga todos los campos y evidencias de un plan existente", () => {
    const { result } = renderHook(() =>
      useFormularioPlaneacionProfesor({
        profesorId: 7,
        asignacionId: 44,
        fechaInicial: "2026-07-28",
      }),
    );

    act(() => {
      result.current.cargarDesdePlan({
        periodo: 4,
        unidad: "Números",
        proposito: "Resolver",
        clase: "Inicio",
        estandar: "Pensamiento numérico",
        dba: "Compara",
        competencias: "Argumenta",
        actividad_casa: "Ejercicios",
        tema: "Fracciones",
        imagen1: "/imagen-1.webp",
        imagen2: null,
      });
    });

    expect(result.current.periodo).toBe("4");
    expect(result.current.form).toEqual({
      unidad: "Números",
      proposito: "Resolver",
      clase: "Inicio",
      estandar: "Pensamiento numérico",
      dba: "Compara",
      competencias: "Argumenta",
      actividad_casa: "Ejercicios",
      tema: "Fracciones",
    });
    expect(result.current.imagenesGuardadas.imagen1).toBe("/imagen-1.webp");
    expect(result.current.estadoGuardado).toEqual({
      cargando: false,
      guardado: true,
      modificado: false,
      guardadoEn: null,
    });
  });

  it("recupera unidad y estándar al preparar un plan nuevo", () => {
    localStorage.setItem(
      crearClaveCamposRecordados(7, 44),
      JSON.stringify({
        unidad: "Geometría",
        estandar: "Pensamiento espacial",
      }),
    );
    const { result } = renderHook(() =>
      useFormularioPlaneacionProfesor({
        profesorId: 7,
        asignacionId: 44,
        fechaInicial: "2026-07-28",
      }),
    );

    act(() => {
      result.current.actualizarCampo("tema", "Ángulos");
      result.current.prepararPlanNuevo();
    });

    expect(result.current.form.unidad).toBe("Geometría");
    expect(result.current.form.estandar).toBe("Pensamiento espacial");
    expect(result.current.form.tema).toBe("");
    expect(result.current.estadoGuardado.modificado).toBe(false);
  });

  it("conserva los valores recordados desde el formulario actual", () => {
    const { result } = renderHook(() =>
      useFormularioPlaneacionProfesor({
        profesorId: 7,
        asignacionId: 44,
        fechaInicial: "2026-07-28",
      }),
    );

    act(() => {
      result.current.actualizarCampo("unidad", "Estadística");
      result.current.actualizarCampo("estandar", "Analiza datos");
    });
    act(() => {
      result.current.recordarCampos();
    });

    expect(
      JSON.parse(
        localStorage.getItem(crearClaveCamposRecordados(7, 44)),
      ),
    ).toEqual({
      unidad: "Estadística",
      estandar: "Analiza datos",
    });
  });
});
