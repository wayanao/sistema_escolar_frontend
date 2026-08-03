import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { crearFilasVacias } from "../../utils/mallaCurricular/planeadorAnual";
import EditorMallaCurricular from "./EditorMallaCurricular";

it("conserva ocho tarjetas móviles, ocho filas de escritorio y sus callbacks", () => {
  const planeadores = crearFilasVacias();
  planeadores[0] = { ...planeadores[0], contenido: "Ecosistemas" };
  const onCampoChange = vi.fn();
  const { container } = render(
    <EditorMallaCurricular
      onCampoChange={onCampoChange}
      periodo="2"
      planeadores={planeadores}
    />
  );

  expect(screen.getAllByRole("heading", { name: /Fila \d/ })).toHaveLength(8);
  expect(container.querySelectorAll(".planeador-table tbody tr")).toHaveLength(8);
  expect(container.querySelector('[name="fecha-mobile-0"]')).toBeRequired();
  expect(container.querySelector('[name="fecha-1"]')).not.toBeRequired();

  fireEvent.change(container.querySelector('[name="contenido-mobile-0"]'), {
    target: { value: "Cadenas tróficas" },
  });
  fireEvent.change(container.querySelector('[name="fecha-0"]'), {
    target: { value: "2026-08-20" },
  });

  expect(onCampoChange).toHaveBeenNthCalledWith(1, 0, "contenido", "Cadenas tróficas");
  expect(onCampoChange).toHaveBeenNthCalledWith(2, 0, "fecha", "2026-08-20");
});
