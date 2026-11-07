import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sweet = vi.hoisted(() => ({
  fire: vi.fn(),
  update: vi.fn(),
  getFooter: vi.fn(),
  getPopup: vi.fn(),
  isVisible: vi.fn(),
  close: vi.fn(),
}));

vi.mock("sweetalert2", () => ({ default: sweet }));

import {
  mostrarEspera,
  mostrarExito,
  opcionesExitoTrasEspera,
  opcionesVentanaEspera,
  opcionesVentanaExito,
  TEXTO_ESPERA,
  TIEMPO_PARA_LEER,
} from "./ventanaExito";

beforeEach(() => {
  Object.values(sweet).forEach((simulada) => simulada.mockReset());
});

describe("ventana de éxito", () => {
  it("se cierra sola, sin botón, con la barrita que se llena en el mismo tiempo", () => {
    const opciones = opcionesVentanaExito({ title: "Grupo guardado", text: "Listo.", timer: 2200 });

    expect(opciones).toMatchObject({
      icon: "success",
      title: "Grupo guardado",
      text: "Listo.",
      timer: 2200,
      showConfirmButton: false,
      customClass: { container: "ventana-exito-fondo", popup: "ventana-exito" },
    });
    expect(opciones.iconHtml).toContain("<svg");
    // La barrita propia, que se llena: la de SweetAlert se vaciaba.
    expect(opciones).not.toHaveProperty("timerProgressBar");
    expect(opciones.footer).toContain('class="ventana-exito__barra"');
    expect(opciones.footer).toContain("--duracion: 2200ms");
    expect(opciones.footer).toContain("--desde: 0%");
  });

  it("sin tiempo propio dura lo de siempre: poco, porque la barrita parece que carga", () => {
    const opciones = opcionesVentanaExito({ title: "Cambios guardados" });

    expect(TIEMPO_PARA_LEER).toBe(1200);
    expect(opciones.timer).toBe(TIEMPO_PARA_LEER);
    expect(opciones.footer).toContain(`--duracion: ${TIEMPO_PARA_LEER}ms`);
  });

  it("suma las clases que pida cada pantalla y deja pasar sus opciones", () => {
    const alCerrar = vi.fn();
    const opciones = opcionesVentanaExito({
      title: "Pago registrado",
      customClass: { htmlContainer: "whitespace-pre-line" },
      didClose: alCerrar,
    });

    expect(opciones.customClass).toEqual({
      container: "ventana-exito-fondo",
      popup: "ventana-exito",
      htmlContainer: "whitespace-pre-line",
    });
    expect(opciones.didClose).toBe(alCerrar);
  });

  it("abre la ventana y devuelve la promesa para esperar que se cierre", async () => {
    sweet.fire.mockResolvedValue({ isDismissed: true });

    const resultado = await mostrarExito({ title: "¡Éxito!", text: "Bienvenido Ana", timer: 1000 });

    expect(sweet.fire).toHaveBeenCalledWith(
      opcionesVentanaExito({ title: "¡Éxito!", text: "Bienvenido Ana", timer: 1000 }),
    );
    expect(resultado).toEqual({ isDismissed: true });
  });
});

describe("una sola espera", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("la tarjeta de espera gira, lleva la barrita y no se puede cerrar", () => {
    const opciones = opcionesVentanaEspera({ title: "Registrando el pago…", text: "No cierres." });

    expect(opciones).toMatchObject({
      title: "Registrando el pago…",
      text: "No cierres.",
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: { popup: "ventana-exito ventana-exito--espera" },
    });
    expect(opciones.iconHtml).toContain("ventana-espera__giro");
    expect(opciones.footer).toContain('role="progressbar"');
    expect(opciones).not.toHaveProperty("icon");
    expect(opciones).not.toHaveProperty("timer");
  });

  it("al terminar, la misma tarjeta pasa a éxito, la barrita sigue y se cierra sola", () => {
    vi.useFakeTimers();
    const ventana = {};
    sweet.getPopup.mockReturnValue(ventana);
    sweet.isVisible.mockReturnValue(true);

    const espera = mostrarEspera({ title: "Registrando el pago…" });
    expect(sweet.fire).toHaveBeenCalledWith(opcionesVentanaEspera({ title: "Registrando el pago…" }));

    espera.exito({ title: "¡Éxito!", text: "Pago aplicado a Junio de 2026." });

    // No se abre otra ventana: se cambia la que ya estaba.
    expect(sweet.fire).toHaveBeenCalledTimes(1);
    expect(sweet.update).toHaveBeenCalledWith(
      opcionesExitoTrasEspera({ title: "¡Éxito!", text: "Pago aplicado a Junio de 2026." }),
    );
    const cambios = sweet.update.mock.calls[0][0];
    expect(cambios).toMatchObject({
      icon: "success",
      showConfirmButton: false,
      allowOutsideClick: true,
      allowEscapeKey: true,
      customClass: { popup: "ventana-exito" },
    });
    // SweetAlert no deja ponerle tiempo a una ventana abierta: lo pone el reloj.
    expect(cambios).not.toHaveProperty("timer");
    // La barrita ya venía llenándose en la espera: termina rápido.
    expect(cambios.footer).toContain("--duracion: 400ms");

    vi.advanceTimersByTime(TIEMPO_PARA_LEER - 1);
    expect(sweet.close).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(sweet.close).toHaveBeenCalledTimes(1);
  });

  it("la barrita sigue desde donde iba la de la espera", () => {
    vi.useFakeTimers();
    const relleno = { getBoundingClientRect: () => ({ width: 60 }) };
    relleno.parentElement = { getBoundingClientRect: () => ({ width: 200 }) };
    sweet.getFooter.mockReturnValue({ querySelector: () => relleno });

    mostrarEspera({ title: "Registrando el pago…" }).exito({ title: "¡Éxito!" });

    expect(sweet.update.mock.calls[0][0].footer).toContain("--desde: 30%");
  });

  it("si ya la cerraron o se abrió otra ventana, el reloj no cierra nada", () => {
    vi.useFakeTimers();
    const tarjeta = { la: "tarjeta" };
    // Al abrirla y al pasar a éxito es la tarjeta; cuando llega el reloj, ya hay otra.
    sweet.getPopup
      .mockReturnValueOnce(tarjeta)
      .mockReturnValueOnce(tarjeta)
      .mockReturnValue({ otra: "ventana" });
    sweet.isVisible.mockReturnValue(true);

    mostrarEspera({ title: "Registrando el pago…" }).exito({ title: "¡Éxito!" });
    vi.advanceTimersByTime(TIEMPO_PARA_LEER);

    expect(sweet.close).not.toHaveBeenCalled();
  });

  it("una carga que solo lee se puede cancelar: Esc o clic afuera llaman alCancelar", async () => {
    let cerrar;
    sweet.fire.mockReturnValueOnce(new Promise((resolve) => {
      cerrar = resolve;
    }));
    const alCancelar = vi.fn();

    mostrarEspera({ title: "Cargando el resumen…", alCancelar });

    expect(sweet.fire).toHaveBeenCalledWith(
      expect.objectContaining({ allowOutsideClick: true, allowEscapeKey: true }),
    );
    cerrar({ isDismissed: true, dismiss: "backdrop" });
    await vi.waitFor(() => expect(alCancelar).toHaveBeenCalledTimes(1));
  });

  it("si la cierra el programa (sin motivo), no cuenta como cancelar", async () => {
    let cerrar;
    sweet.fire.mockReturnValueOnce(new Promise((resolve) => {
      cerrar = resolve;
    }));
    const alCancelar = vi.fn();

    mostrarEspera({ title: "Cargando el resumen…", alCancelar });
    cerrar({ isDismissed: true });
    await new Promise((listo) => setTimeout(listo, 0));

    expect(alCancelar).not.toHaveBeenCalled();
  });

  it("la espera dice qué no hacer mientras guarda, si la pantalla no pide otra cosa", () => {
    expect(opcionesVentanaEspera({ title: "Guardando asistencia…" }).text).toBe(TEXTO_ESPERA);
  });

  it("cerrar quita la tarjeta de espera, pero solo si sigue abierta esa misma", () => {
    const tarjeta = { la: "tarjeta" };
    sweet.getPopup.mockReturnValue(tarjeta);
    sweet.isVisible.mockReturnValue(true);

    mostrarEspera({ title: "Guardando anotación…" }).cerrar();
    expect(sweet.close).toHaveBeenCalledTimes(1);

    sweet.close.mockClear();
    sweet.getPopup.mockReturnValueOnce(tarjeta).mockReturnValue({ otra: "ventana" });
    mostrarEspera({ title: "Guardando anotación…" }).cerrar();
    expect(sweet.close).not.toHaveBeenCalled();
  });
});
