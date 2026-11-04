import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ValoresPersonalizadosPago from "./ValoresPersonalizadosPago";

const MENSUALIDAD = {
  tipoPagoId: 11,
  nombre: "MENSUALIDAD",
  tipoCobro: "mensual",
  precioCurso: 200000,
  valorPersonalizado: 180000,
  personalizado: true,
  motivo: "Beca parcial",
  valorAPagar: 180000,
};

const propsBase = {
  anio: 2026,
  estudianteNombre: "Ana Pérez",
  valoresPersonalizados: [],
  filas: [MENSUALIDAD],
  borradores: { 11: { valor: "180000", motivo: "Beca parcial" } },
  cargando: false,
  guardandoTipoId: null,
  mensaje: "",
  error: "",
  onAbrir: vi.fn(),
  onCambiarBorrador: vi.fn(),
  onGuardar: vi.fn(),
  onVolverAlPrecio: vi.fn(),
};

const barra = () => screen.getByRole("button", { name: /Valores personalizados/ });

describe("ValoresPersonalizadosPago", () => {
  it("empieza cerrado, no pide nada y la barra dice cuántos tiene", () => {
    const onAbrir = vi.fn();
    const { rerender } = render(<ValoresPersonalizadosPago {...propsBase} onAbrir={onAbrir} />);

    expect(barra()).toHaveAttribute("aria-expanded", "false");
    expect(barra()).toHaveTextContent("Usa los valores normales de su curso");
    expect(screen.queryByRole("region", { name: /Valores de pago/ })).not.toBeInTheDocument();
    expect(onAbrir).not.toHaveBeenCalled();

    rerender(
      <ValoresPersonalizadosPago
        {...propsBase}
        onAbrir={onAbrir}
        valoresPersonalizados={[{ id: 31 }, { id: 32 }]}
      />
    );
    expect(barra()).toHaveTextContent("2 conceptos con valor personalizado");
  });

  it("al abrir pide los conceptos y muestra el recuadro de matricular", () => {
    const props = { ...propsBase, onAbrir: vi.fn(), onGuardar: vi.fn(), onVolverAlPrecio: vi.fn() };
    render(<ValoresPersonalizadosPago {...props} valoresPersonalizados={[{ id: 31 }]} />);

    fireEvent.click(barra());

    expect(props.onAbrir).toHaveBeenCalledTimes(1);
    expect(barra()).toHaveAttribute("aria-expanded", "true");
    const recuadro = screen.getByRole("region", { name: "Valores de pago de Ana Pérez" });
    expect(within(recuadro).getByText(/Lo que se le cobrará en 2026/)).toBeInTheDocument();
    const mensualidad = within(recuadro).getByRole("listitem", { name: "MENSUALIDAD" });
    expect(within(mensualidad).getByText(/Precio del curso:/)).toHaveTextContent(/200\.000/);

    fireEvent.click(screen.getByRole("button", { name: "Guardar el valor de MENSUALIDAD" }));
    fireEvent.click(screen.getByRole("button", { name: "Volver al precio del curso en MENSUALIDAD" }));

    expect(props.onGuardar).toHaveBeenCalledWith(11);
    expect(props.onVolverAlPrecio).toHaveBeenCalledWith(11);
  });

  it("Cerrar del recuadro lo cierra y volver a abrir lo pide otra vez", () => {
    const onAbrir = vi.fn();
    render(<ValoresPersonalizadosPago {...propsBase} onAbrir={onAbrir} />);
    fireEvent.click(barra());

    fireEvent.click(screen.getByRole("button", { name: "Cerrar valores de pago" }));

    expect(barra()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region", { name: /Valores de pago/ })).not.toBeInTheDocument();
    fireEvent.click(barra());
    expect(onAbrir).toHaveBeenCalledTimes(2);
  });

  it("sin año en el contexto habla de este año", () => {
    render(<ValoresPersonalizadosPago {...propsBase} anio={null} />);
    fireEvent.click(barra());

    expect(screen.getByText(/Lo que se le cobrará en este año\./)).toBeInTheDocument();
  });
});
