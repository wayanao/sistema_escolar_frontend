import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ValoresPersonalizadosPago from "./ValoresPersonalizadosPago";

const propsBase = {
  tiposPagos: [{ id: 11, nombre: "Pensión", valor: 100000 }],
  valoresPersonalizados: [],
  valorPersonalizadoData: { tipo_pago_id: "", valor: "", motivo: "" },
  guardandoValorPersonalizado: false,
  onSeleccionarTipo: vi.fn(),
  onActualizarCampo: vi.fn(),
  onGuardar: vi.fn(),
  onQuitar: vi.fn(),
};

describe("ValoresPersonalizadosPago", () => {
  it("conserva el estado vacío y delega la edición del formulario", () => {
    const onSeleccionarTipo = vi.fn();
    const onActualizarCampo = vi.fn();
    const onGuardar = vi.fn();
    render(
      <ValoresPersonalizadosPago
        {...propsBase}
        onSeleccionarTipo={onSeleccionarTipo}
        onActualizarCampo={onActualizarCampo}
        onGuardar={onGuardar}
      />
    );

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "11" } });
    fireEvent.change(screen.getByPlaceholderText("Valor personalizado"), {
      target: { value: "85000" },
    });
    fireEvent.change(screen.getByPlaceholderText("Motivo o acuerdo"), {
      target: { value: "Acuerdo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar valor" }));

    expect(screen.getByText("Este estudiante usa los valores normales de su curso.")).toBeInTheDocument();
    expect(onSeleccionarTipo).toHaveBeenCalledWith("11");
    expect(onActualizarCampo).toHaveBeenCalledWith("valor", "85000");
    expect(onActualizarCampo).toHaveBeenCalledWith("motivo", "Acuerdo");
    expect(onGuardar).toHaveBeenCalledTimes(1);
  });

  it("presenta el valor existente y delega editar o quitar", () => {
    const onSeleccionarTipo = vi.fn();
    const onQuitar = vi.fn();
    const valorPersonalizado = {
      id: 31,
      tipo_pago_id: 11,
      tipo_pago_nombre: "Pensión",
      valor: 85000,
      valor_curso: 100000,
      motivo: "Acuerdo familiar",
    };
    render(
      <ValoresPersonalizadosPago
        {...propsBase}
        valoresPersonalizados={[valorPersonalizado]}
        onSeleccionarTipo={onSeleccionarTipo}
        onQuitar={onQuitar}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.click(screen.getByRole("button", { name: "Quitar" }));

    expect(screen.getByText("Acuerdo familiar", { exact: false })).toBeInTheDocument();
    expect(onSeleccionarTipo).toHaveBeenCalledWith(11);
    expect(onQuitar).toHaveBeenCalledWith(valorPersonalizado);
  });
});
