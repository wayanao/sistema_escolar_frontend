import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ResumenDeudaPago from "./ResumenDeudaPago";

const pension = {
  clave: "concepto-11",
  nombre: "Pensión",
  monto: 300000,
  mesesPendientes: 3,
  abonado: 0,
  mora: 20000,
  valorPersonalizado: true,
  inventario: false,
  cobro: { concepto: "Pensión" },
};

const uniforme = {
  clave: "venta-80",
  nombre: "Uniforme",
  monto: 90000,
  mesesPendientes: 0,
  abonado: 0,
  mora: 0,
  valorPersonalizado: false,
  inventario: true,
  cobro: { ventaId: 80 },
};

const propsBase = {
  anio: 2026,
  resumen: { filas: [], total: 0 },
  cargando: false,
  error: "",
  onReintentar: vi.fn(),
  onCobrar: vi.fn(),
};

describe("ResumenDeudaPago", () => {
  it("muestra cada concepto con su detalle, el total y un Cobrar por fila", () => {
    const onCobrar = vi.fn();
    render(
      <ResumenDeudaPago
        {...propsBase}
        resumen={{ filas: [pension, uniforme], total: 390000 }}
        onCobrar={onCobrar}
      />
    );

    const resumen = screen.getByRole("region", { name: "Lo que debe en 2026" });
    expect(within(resumen).getByText("$390.000")).toBeInTheDocument();
    expect(
      within(resumen).getByText("3 meses pendientes · Incluye mora de $20.000")
    ).toBeInTheDocument();
    expect(within(resumen).getByText("Valor personalizado")).toBeInTheDocument();
    expect(within(resumen).getByText("Cargo de inventario")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cobrar Uniforme" }));

    expect(onCobrar).toHaveBeenCalledWith(uniforme);
    expect(screen.queryByText(/Al día/)).not.toBeInTheDocument();
  });

  it("mientras consulta no dice que está al día y no deja cobrar", () => {
    const { rerender } = render(<ResumenDeudaPago {...propsBase} cargando />);

    expect(screen.getByText("Consultando lo que debe...")).toBeInTheDocument();
    expect(screen.queryByText(/Al día/)).not.toBeInTheDocument();

    rerender(
      <ResumenDeudaPago
        {...propsBase}
        cargando
        resumen={{ filas: [pension], total: 300000 }}
      />
    );
    expect(screen.getByRole("button", { name: "Cobrar Pensión" })).toBeDisabled();
    expect(screen.getByText("Actualizando...")).toBeInTheDocument();
  });

  it("dice que está al día solo cuando ya consultó todo sin errores", () => {
    render(<ResumenDeudaPago {...propsBase} />);

    expect(screen.getByText("Al día: no debe nada en 2026.")).toBeInTheDocument();
  });

  it("con error avisa, ofrece reintentar y no muestra un total incompleto", () => {
    const onReintentar = vi.fn();
    render(
      <ResumenDeudaPago
        {...propsBase}
        resumen={{ filas: [pension], total: 300000 }}
        error="No se pudieron consultar los cargos de inventario."
        onReintentar={onReintentar}
      />
    );

    const aviso = screen.getByRole("alert");
    expect(aviso).toHaveTextContent("No se pudieron consultar los cargos de inventario.");
    fireEvent.click(within(aviso).getByRole("button", { name: "Reintentar" }));

    expect(onReintentar).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("$300.000", { selector: "p" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Al día/)).not.toBeInTheDocument();
  });

  it("sin año en el contexto usa un título general", () => {
    render(<ResumenDeudaPago {...propsBase} anio={null} />);

    expect(screen.getByRole("region", { name: "Lo que debe" })).toBeInTheDocument();
    expect(screen.getByText("Al día: no debe nada.")).toBeInTheDocument();
  });
});
