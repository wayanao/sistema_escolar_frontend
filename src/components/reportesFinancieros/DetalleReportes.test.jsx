import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DetalleReportes from "./DetalleReportes";

const ingresoSimple = {
  id: 1,
  estudiante: "Ana Pérez",
  monto: 100000,
  monto_valido: 100000,
  fecha: "08/08/2026 09:00",
  descripcion: "Pensión agosto",
  tipo_pago: "Efectivo",
  estado: "Pagado",
  anulado: false,
};

const ingresoAnulado = {
  id: 2,
  estudiante: "Luis Gómez",
  monto: 50000,
  monto_valido: 0,
  fecha: "08/08/2026 10:00",
  descripcion: "Matrícula",
  tipo_pago: "Tarjeta",
  estado: "Anulado",
  anulado: true,
  motivo_anulacion: "Error de registro",
};

const egreso = {
  id: 9,
  concepto: "Papelería",
  monto: 30000,
  fecha: "08/08/2026",
  categoria: "Insumos",
  notas: "Compra mensual",
  origen: "manual",
};

describe("DetalleReportes — ingresos", () => {
  it("presenta la tabla de ingresos con medios de pago, estado y fila anulada", () => {
    render(
      <DetalleReportes
        detalleTipo="ingresos"
        detalleTitulo="Ingresos de hoy"
        loadingDetalle={false}
        filtroMedioIngreso="todos"
        onCambiarFiltroMedioIngreso={vi.fn()}
        onCerrar={vi.fn()}
        detalleEgresos={[]}
        detalleIngresosFiltrados={[ingresoSimple, ingresoAnulado]}
        totalDetalleIngresos={100000}
        totalDetalleEgresos={0}
      />
    );

    expect(screen.getByText("Detalle de ingresos")).toBeInTheDocument();
    expect(screen.getByText("Ingresos de hoy")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Luis Gómez")).toBeInTheDocument();
    expect(screen.getByText("Anulado")).toBeInTheDocument();
    expect(screen.getByText("Pagado")).toBeInTheDocument();
    expect(screen.getByText("Motivo: Error de registro")).toBeInTheDocument();
    expect(screen.getByTitle("Filtrar por medio de pago")).toBeInTheDocument();
  });

  it("presenta el estado vacío cuando no hay ingresos filtrados", () => {
    render(
      <DetalleReportes
        detalleTipo="ingresos"
        detalleTitulo="Ingresos de hoy"
        loadingDetalle={false}
        filtroMedioIngreso="subsidio"
        onCambiarFiltroMedioIngreso={vi.fn()}
        onCerrar={vi.fn()}
        detalleEgresos={[]}
        detalleIngresosFiltrados={[]}
        totalDetalleIngresos={0}
        totalDetalleEgresos={0}
      />
    );

    expect(screen.getByText("No hay ingresos para el medio de pago seleccionado.")).toBeInTheDocument();
  });

  it("delega el cambio de filtro de medio de pago", () => {
    const onCambiarFiltroMedioIngreso = vi.fn();
    render(
      <DetalleReportes
        detalleTipo="ingresos"
        detalleTitulo="Ingresos de hoy"
        loadingDetalle={false}
        filtroMedioIngreso="todos"
        onCambiarFiltroMedioIngreso={onCambiarFiltroMedioIngreso}
        onCerrar={vi.fn()}
        detalleEgresos={[]}
        detalleIngresosFiltrados={[ingresoSimple]}
        totalDetalleIngresos={100000}
        totalDetalleEgresos={0}
      />
    );

    fireEvent.change(screen.getByTitle("Filtrar por medio de pago"), { target: { value: "tarjeta" } });

    expect(onCambiarFiltroMedioIngreso).toHaveBeenCalledWith("tarjeta");
  });

  it("delega el cierre del detalle", () => {
    const onCerrar = vi.fn();
    render(
      <DetalleReportes
        detalleTipo="ingresos"
        detalleTitulo="Ingresos de hoy"
        loadingDetalle={false}
        filtroMedioIngreso="todos"
        onCambiarFiltroMedioIngreso={vi.fn()}
        onCerrar={onCerrar}
        detalleEgresos={[]}
        detalleIngresosFiltrados={[]}
        totalDetalleIngresos={0}
        totalDetalleEgresos={0}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onCerrar).toHaveBeenCalledTimes(1);
  });
});

describe("DetalleReportes — egresos", () => {
  it("presenta la tabla de egresos sin el selector de medio de pago", () => {
    render(
      <DetalleReportes
        detalleTipo="egresos"
        detalleTitulo="Egresos de hoy"
        loadingDetalle={false}
        filtroMedioIngreso="todos"
        onCambiarFiltroMedioIngreso={vi.fn()}
        onCerrar={vi.fn()}
        detalleEgresos={[egreso]}
        detalleIngresosFiltrados={[]}
        totalDetalleIngresos={0}
        totalDetalleEgresos={30000}
      />
    );

    expect(screen.getByText("Detalle de egresos")).toBeInTheDocument();
    expect(screen.getByText("Papelería")).toBeInTheDocument();
    expect(screen.getByText("Compra mensual")).toBeInTheDocument();
    expect(screen.getByText("Insumos")).toBeInTheDocument();
    expect(screen.getByText("manual")).toBeInTheDocument();
    expect(screen.queryByTitle("Filtrar por medio de pago")).not.toBeInTheDocument();
  });

  it("presenta el estado vacío cuando no hay egresos en el rango", () => {
    render(
      <DetalleReportes
        detalleTipo="egresos"
        detalleTitulo="Egresos de hoy"
        loadingDetalle={false}
        filtroMedioIngreso="todos"
        onCambiarFiltroMedioIngreso={vi.fn()}
        onCerrar={vi.fn()}
        detalleEgresos={[]}
        detalleIngresosFiltrados={[]}
        totalDetalleIngresos={0}
        totalDetalleEgresos={0}
      />
    );

    expect(screen.getByText("No hay egresos en este rango.")).toBeInTheDocument();
  });
});

describe("DetalleReportes — estados y ref", () => {
  it("muestra el indicador de carga en vez de las tablas", () => {
    render(
      <DetalleReportes
        detalleTipo="ingresos"
        detalleTitulo="Ingresos de hoy"
        loadingDetalle={true}
        filtroMedioIngreso="todos"
        onCambiarFiltroMedioIngreso={vi.fn()}
        onCerrar={vi.fn()}
        detalleEgresos={[]}
        detalleIngresosFiltrados={[]}
        totalDetalleIngresos={0}
        totalDetalleEgresos={0}
      />
    );

    expect(screen.getByText("Cargando detalle...")).toBeInTheDocument();
  });

  it("reenvía el ref al contenedor raíz para el scroll automático", () => {
    const ref = createRef();
    render(
      <DetalleReportes
        ref={ref}
        detalleTipo="ingresos"
        detalleTitulo="Ingresos de hoy"
        loadingDetalle={false}
        filtroMedioIngreso="todos"
        onCambiarFiltroMedioIngreso={vi.fn()}
        onCerrar={vi.fn()}
        detalleEgresos={[]}
        detalleIngresosFiltrados={[]}
        totalDetalleIngresos={0}
        totalDetalleEgresos={0}
      />
    );

    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toHaveClass("border-green-200");
  });
});
