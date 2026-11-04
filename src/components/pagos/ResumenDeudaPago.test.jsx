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

const transporte = {
  clave: "adelanto-13",
  nombre: "Transporte",
  alDia: true,
  valorMes: 100000,
  mesesPorAdelantar: 2,
  cobro: { concepto: "Transporte" },
};

const refrigerio = {
  clave: "adelanto-14",
  nombre: "Refrigerio",
  alDia: true,
  valorMes: 30000,
  mesesPorAdelantar: 0,
  cobro: { concepto: "Refrigerio" },
};

const propsBase = {
  anio: 2026,
  resumen: { filas: [], total: 0 },
  cargando: false,
  error: "",
  errorAdelanto: "",
  onReintentar: vi.fn(),
  onReintentarAdelanto: vi.fn(),
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

  it("se ve de lejos si debe: borde rojo con deuda, verde al día y gris mientras consulta", () => {
    const { rerender } = render(
      <ResumenDeudaPago {...propsBase} resumen={{ filas: [pension], total: 300000 }} />
    );
    const recuadro = () => screen.getByRole("region", { name: "Lo que debe en 2026" });
    expect(recuadro()).toHaveClass("border-red-300");

    rerender(<ResumenDeudaPago {...propsBase} resumen={{ filas: [transporte], total: 0 }} />);
    expect(recuadro()).toHaveClass("border-emerald-200");

    rerender(<ResumenDeudaPago {...propsBase} cargando />);
    expect(recuadro()).toHaveClass("border-gray-200");
  });

  it("el Cobrar es un botón verde lleno, para que se note", () => {
    render(<ResumenDeudaPago {...propsBase} resumen={{ filas: [pension], total: 300000 }} />);

    expect(screen.getByRole("button", { name: "Cobrar Pensión" })).toHaveClass(
      "bg-green-600",
      "text-white"
    );
  });

  it("los conceptos al día salen con Adelantar y no suman al total", () => {
    const onCobrar = vi.fn();
    render(
      <ResumenDeudaPago
        {...propsBase}
        resumen={{ filas: [pension, transporte, refrigerio], total: 300000 }}
        onCobrar={onCobrar}
      />
    );

    expect(screen.getByText("$300.000", { selector: "p" })).toBeInTheDocument();
    expect(
      screen.getByText("Al día · $100.000 por mes · 2 meses por adelantar")
    ).toBeInTheDocument();
    expect(screen.getByText("Al día · Sin meses por adelantar")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Adelantar Refrigerio" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Adelantar Transporte" }));

    expect(onCobrar).toHaveBeenCalledWith(transporte);
  });

  it("sin deudas dice que está al día y deja adelantar", () => {
    render(<ResumenDeudaPago {...propsBase} resumen={{ filas: [transporte], total: 0 }} />);

    expect(screen.getByText("Al día: no debe nada en 2026.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adelantar Transporte" })).toBeEnabled();
  });

  it("si fallan los meses para adelantar, avisa aparte y conserva el total", () => {
    const onReintentarAdelanto = vi.fn();
    render(
      <ResumenDeudaPago
        {...propsBase}
        resumen={{ filas: [pension], total: 300000 }}
        errorAdelanto="No se pudieron consultar los meses disponibles."
        onReintentarAdelanto={onReintentarAdelanto}
      />
    );

    expect(screen.getByText(/No se pudieron consultar los meses disponibles\./)).toBeInTheDocument();
    expect(screen.getByText("$300.000", { selector: "p" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar los meses para adelantar" }));

    expect(onReintentarAdelanto).toHaveBeenCalledTimes(1);
  });

  it("sin año en el contexto usa un título general", () => {
    render(<ResumenDeudaPago {...propsBase} anio={null} />);

    expect(screen.getByRole("region", { name: "Lo que debe" })).toBeInTheDocument();
    expect(screen.getByText("Al día: no debe nada.")).toBeInTheDocument();
  });
});
