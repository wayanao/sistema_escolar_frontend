import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { crearFilasVacias } from "../../utils/mallaCurricular/planeadorAnual";
import VistaImprimibleMallaCurricular from "./VistaImprimibleMallaCurricular";

vi.mock("../impresion/DocumentoImprimible", () => ({
  default: ({ children, subtitulo, titulo }) => (
    <section>
      <h1>{titulo}</h1>
      <p>{subtitulo}</p>
      {children}
    </section>
  ),
}));

it("conserva contexto, ocho filas impresas y la acción para regresar", () => {
  const planeadores = crearFilasVacias();
  planeadores[2] = { ...planeadores[2], contenido: "Ecosistemas", fecha: "2026-08-20" };
  const onRegresar = vi.fn();
  const { container } = render(
    <VistaImprimibleMallaCurricular
      asignacion={{ curso: "6A", materia: "Ciencias" }}
      onRegresar={onRegresar}
      periodo="2"
      planeadores={planeadores}
    />
  );

  expect(screen.getByText("6A · Ciencias · Período 2")).toBeInTheDocument();
  expect(screen.getByText("Ecosistemas")).toBeInTheDocument();
  expect(container.querySelectorAll("tbody tr")).toHaveLength(8);

  fireEvent.click(screen.getByRole("button", { name: /Atrás/ }));
  expect(onRegresar).toHaveBeenCalledTimes(1);
});
