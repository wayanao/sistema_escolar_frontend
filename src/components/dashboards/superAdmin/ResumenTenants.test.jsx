import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ResumenTenants from "./ResumenTenants";

const valorDe = (etiqueta) =>
    screen.getByText(etiqueta).parentElement.querySelector("p:last-child").textContent;

describe("ResumenTenants", () => {
    it("pinta las cinco cifras del resumen en orden", () => {
        render(
            <ResumenTenants
                resumen={{ total: 4, activo: 2, en_mora: 1, suspendido: 1, cancelado: 0 }}
            />,
        );

        expect(valorDe("Total")).toBe("4");
        expect(valorDe("Activos")).toBe("2");
        expect(valorDe("En mora")).toBe("1");
        expect(valorDe("Suspendidos")).toBe("1");
        expect(valorDe("Cancelados")).toBe("0");
    });

    it("muestra ceros cuando no hay colegios", () => {
        render(
            <ResumenTenants
                resumen={{ total: 0, activo: 0, en_mora: 0, suspendido: 0, cancelado: 0 }}
            />,
        );

        expect(screen.getAllByText("0")).toHaveLength(5);
    });
});
