import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import NavSuperAdminView from "./NavSuperAdminView";

// Las barras del admin y del profesor se cambiaron por el menú lateral el
// 2026-11-04; sus pruebas viven en MenuLateralView.test.jsx. Aquí queda la del
// super admin, que conserva su barra.
describe("vistas de navegacion", () => {
  it("presenta identidad, ruta y callback de super admin", async () => {
    const user = userEvent.setup();
    const onCerrarSesion = vi.fn();
    render(
      <MemoryRouter initialEntries={["/super-admin"]}>
        <NavSuperAdminView
          nombre="Soporte Auligo"
          onCerrarSesion={onCerrarSesion}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Plataforma: Soporte Auligo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tenants" })).toHaveAttribute(
      "href",
      "/super-admin",
    );
    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(onCerrarSesion).toHaveBeenCalledTimes(1);
  });
});
